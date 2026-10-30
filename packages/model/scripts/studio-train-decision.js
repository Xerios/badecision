#!/usr/bin/env node
// Train the decision model in Unsloth Studio over its API (what "Train as: Decision model" does in the UI).
//   node scripts/studio-train-decision.js                       # Laya (ModernBERT-large) on data/decision/*.jsonl
//   node scripts/studio-train-decision.js --model unsloth/Qwen3.5-0.8B --epochs 2 --lr 2e-4 --r 16
//   node scripts/studio-train-decision.js --status              # just print the current run
// Steps: upload train/eval -> POST /api/train/start {is_decision: true} -> poll /api/train/status until done.
// Build the data first: node scripts/build-decision-dataset.js

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { client, argFlags, loadEnv, ROOT } from './lib/unsloth.js';

const f = argFlags();
const api = client({ timeoutMs: 600000 });
loadEnv();

async function upload(file) {
  const form = new FormData();
  form.append('file', new Blob([readFileSync(join(ROOT, file))], { type: 'application/octet-stream' }), basename(file).replace(/^/, 'bdm-'));
  const res = await fetch(`${api.baseUrl}/api/datasets/upload`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.UNSLOTH_INSTANCE === 'local' ? process.env.UNSLOTH_LOCAL_API_KEY : process.env.UNSLOTH_API_KEY}` }, body: form });
  if (!res.ok) throw new Error(`upload ${file}: ${res.status} ${await res.text()}`);
  return (await res.json()).stored_path;
}

const fmt = (s) => (s == null ? '?' : s > 90 ? `${Math.round(s / 60)} min` : `${Math.round(s)} s`);
async function watch() {
  let last = '';
  for (;;) {
    const s = await api.get('/api/train/status');
    const d = s.details ?? {};
    const line = `${s.phase} step ${d.step}/${d.total_steps} epoch ${d.epoch} loss ${d.loss ?? '-'} eta ${fmt(d.eta_seconds)} ${s.message ?? ''}`;
    if (line !== last) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${line}`); last = line; }
    if (s.error) { console.error('error:', s.error); return s; }
    if (!s.is_training_running && !['starting', 'queued', 'loading', 'preparing'].includes(s.phase) && d.step > 0) return s;
    await new Promise((r) => setTimeout(r, 15000));
  }
}

if (f.status) { console.log(JSON.stringify(await api.get('/api/train/status'), null, 1)); process.exit(0); }

const train = await upload(f.train ?? 'data/decision/train.jsonl');
const evalPath = await upload(f.eval ?? 'data/decision/eval.jsonl');
console.log('uploaded:', train, evalPath);

const model = f.model ?? 'convaiinnovations/laya';
const laya = model === 'convaiinnovations/laya';
const body = {
  model_name: model,
  ...(f.subfolder ? { model_subfolder: f.subfolder } : {}),
  project_name: f.name ?? 'bad-decision',
  training_type: 'LoRA/QLoRA',
  is_decision: true,
  local_datasets: [train],
  local_eval_datasets: [evalPath],
  format_type: 'auto',
  max_seq_length: +(f['max-seq'] ?? 256),
  load_in_4bit: !laya,
  // Laya's own recommended config (but 2 epochs: 4 overfit, eval loss was lowest after epoch 1);
  // the Unsloth docs' recipe (2e-4, r16) for LLM bases
  num_epochs: +(f.epochs ?? 2),
  learning_rate: String(f.lr ?? (laya ? '8e-4' : '2e-4')),
  batch_size: +(f.batch ?? 8),
  gradient_accumulation_steps: +(f.accum ?? (laya ? 8 : 4)),
  lora_r: +(f.r ?? (laya ? 64 : 16)),
  lora_alpha: +(f.r ?? (laya ? 64 : 16)),
  lora_dropout: 0,
  weight_decay: 0.01,
  lr_scheduler_type: 'cosine',
  optim: laya ? 'adamw_torch' : 'adamw_8bit',
  packing: false,
  train_on_completions: false,
  eval_steps: 0.25,
  early_stopping_patience: +(f.patience ?? 2), // keeps the best weights by eval loss
  save_steps: 200,
  random_seed: 3407,
};
console.log('starting:', JSON.stringify(body));
const started = await api.post('/api/train/start', body);
console.log('start response:', JSON.stringify(started).slice(0, 500));
const final = await watch();
mkdirSync(join(ROOT, 'studio'), { recursive: true });
writeFileSync(join(ROOT, 'studio', 'last-decision-run.json'), JSON.stringify({ request: body, start: started, final }, null, 2));
console.log('\nfinal:', JSON.stringify(final).slice(0, 1500), '\nwrote studio/last-decision-run.json');
