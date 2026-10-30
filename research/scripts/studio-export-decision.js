#!/usr/bin/env node
// Export a trained decision checkpoint to GGUF in Studio (CPU-friendly, llama.cpp; like the catalog's laya-gguf).
//   node scripts/studio-export-decision.js                       # newest bad-decision checkpoint, q8_0 + q4_k_m
//   node scripts/studio-export-decision.js --checkpoint <path> --quant q8_0
// Files land in <checkpoint>/gguf on the Studio PC.

import { client, argFlags } from './lib/unsloth.js';

const f = argFlags();
const api = client({ timeoutMs: 1800000, retries: 0 });

let ckpt = f.checkpoint;
if (!ckpt) {
  const { models } = await api.get('/api/models/checkpoints');
  const ours = models.filter((m) => /bad-decision/.test(m.name)).sort((a, b) => a.name.localeCompare(b.name));
  if (!ours.length) throw new Error('no bad-decision checkpoint found');
  ckpt = ours.at(-1).checkpoints.at(-1).path;
}
const info = (await api.get(`/api/export/decision-info?checkpoint_path=${encodeURIComponent(ckpt)}`)).decision;
console.log('checkpoint:', ckpt, '\ndecision export info:', JSON.stringify(info));
if (!info?.eligible) throw new Error(`not exportable: ${info?.reason ?? 'not a decision checkpoint'}`);

const quants = (f.quant ?? 'q8_0,q4_k_m').split(',').filter((q) => info.quantizations.includes(q));
console.log('loading checkpoint into the export backend ...');
console.log(JSON.stringify(await api.post('/api/export/load-checkpoint', { checkpoint_path: ckpt, load_in_4bit: false, max_seq_length: 512 })).slice(0, 300));
console.log(`exporting ${quants.join(', ')} -> ${info.output_dir}`);
const r = await api.post('/api/export/export/gguf', { save_directory: info.output_dir, quantization_method: quants, expected_checkpoint: ckpt });
console.log(JSON.stringify(r).slice(0, 1500));
console.log('status:', JSON.stringify(await api.get('/api/export/status')).slice(0, 800));
