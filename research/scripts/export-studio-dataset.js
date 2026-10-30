#!/usr/bin/env node
// Phase 3a: turn our labelled data into a fine-tuning dataset for Unsloth Studio.
//   node scripts/export-studio-dataset.js [--in data/seed.train.jsonl,data/teacher.jsonl] [--soft-copies 0]
// Writes data/studio/{train,eval}.chat.jsonl    {"messages":[system,user,assistant]}   (OpenAI / "messages" format)
//        data/studio/{train,eval}.sharegpt.jsonl {"conversations":[{"from":"system"...}]} (ShareGPT format)
//        data/studio/{train,eval}.alpaca.jsonl   {"instruction","input","output"}       (Alpaca format)
// Upload whichever format your Studio version's dataset picker accepts.
//
// The assistant answer is the argmax label. --soft-copies N adds N extra copies per row whose answer is
// SAMPLED from the soft probabilities, so the fine-tuned LLM learns graded uncertainty, not just argmax.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { argFlags, ROOT } from './lib/unsloth.js';
import { SYSTEM } from './lib/teacher.js';
import { LABELS } from '../../packages/core/src/features.js';

const f = argFlags();
const inputs = (f.in ?? ['data/seed.train.jsonl', 'data/teacher.jsonl'].filter((p) => existsSync(join(ROOT, p))).join(',')).split(',');
const softCopies = +(f['soft-copies'] ?? 0);
let s = 42; const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);

const rows = inputs.flatMap((p) => readFileSync(join(ROOT, p), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)))
  .map((r) => ({ text: r.text, probs: r.probs ?? LABELS.map((l) => (l === r.label ? 1 : 0)) }));
const examples = [];
for (const r of rows) {
  examples.push({ text: r.text, answer: LABELS[r.probs.indexOf(Math.max(...r.probs))] });
  for (let k = 0; k < softCopies; k++) {
    let x = rnd(), i = 0; while (i < 3 && (x -= r.probs[i]) > 0) i++;
    examples.push({ text: r.text, answer: LABELS[i] });
  }
}
for (let i = examples.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [examples[i], examples[j]] = [examples[j], examples[i]]; }
const nEval = Math.min(500, Math.round(examples.length * 0.05));
const split = { eval: examples.slice(0, nEval), train: examples.slice(nEval) };

const dir = join(ROOT, 'data', 'studio');
mkdirSync(dir, { recursive: true });
mkdirSync(join(ROOT, 'studio'), { recursive: true });
writeFileSync(join(ROOT, 'studio', 'system_prompt.txt'), SYSTEM + '\n'); // used by studio/train_answer_head.py
for (const [name, ex] of Object.entries(split)) {
  const w = (fmt, fn) => writeFileSync(join(dir, `${name}.${fmt}.jsonl`), ex.map((e) => JSON.stringify(fn(e))).join('\n') + '\n');
  w('chat', (e) => ({ messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: e.text }, { role: 'assistant', content: e.answer }] }));
  w('sharegpt', (e) => ({ conversations: [{ from: 'system', value: SYSTEM }, { from: 'human', value: e.text }, { from: 'gpt', value: e.answer }] }));
  w('alpaca', (e) => ({ instruction: SYSTEM, input: e.text, output: e.answer }));
}
const dist = Object.fromEntries(LABELS.map((l) => [l, split.train.filter((e) => e.answer === l).length]));
console.log(`from ${inputs.join(' + ')}: ${rows.length} rows -> train ${split.train.length}, eval ${split.eval.length}`);
console.log('train answers:', dist);
console.log('wrote data/studio/{train,eval}.{chat,sharegpt,alpaca}.jsonl');
