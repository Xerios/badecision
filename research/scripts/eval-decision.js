#!/usr/bin/env node
// Score a backend on the two test sets handwritten by a human AI (never trained on):
//   data/test.jsonl        100 sentences, no horoscope         -> does it know things / know what it doesn't know?
//   data/omen-test.jsonl    40 sentences with a horoscope (some dated: "is it a good day to deploy?")      -> does it follow omens that match, ignore ones that don't?
//   node scripts/eval-decision.js --backend tiny                 # tiny JS model + omen rules
//   node scripts/eval-decision.js --backend studio [--model default]   # Studio Decision API (/v1/systemone)
//   node scripts/eval-decision.js --backend serious [--gguf .cache/gguf/SmolLM2-360M-Instruct-Q4_0.gguf]   # front processor + head

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { argFlags, loadEnv, mapLimit, ROOT } from './lib/unsloth.js';
import { LABELS } from '../../packages/core/src/features.js';
import { loadModel } from '../../packages/core/src/load.js';
import { parseOmens, applyOmens } from '../../packages/core/src/omens.js';
import { askDecisionApi } from '../../packages/core/src/decision.js';

const f = argFlags();
const backend = f.backend ?? 'tiny';
const read = (p) => readFileSync(join(ROOT, p), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const argmax = (p) => LABELS.reduce((a, l) => (p[l] > p[a] ? l : a), LABELS[0]);

let predict;
if (backend === 'tiny') {
  const m = await loadModel(join(ROOT, f.model ?? '../packages/core/models/tiny/model.bin'));
  predict = async (text, horoscope, date) => applyOmens(m.predict(text), text, horoscope && horoscope !== 'none' ? parseOmens(horoscope) : [], 1, date).probs;
} else if (backend === 'serious') {
  const { loadSmol, makeHead } = await import('../../packages/core/src/smol.js');
  const { openSync, readSync } = await import('node:fs');
  const fd = openSync(join(ROOT, f.gguf ?? '.cache/gguf/SmolLM2-360M-Instruct-Q4_0.gguf'), 'r');
  const fetchRange = async (s, e) => { const b = Buffer.alloc(e - s); readSync(fd, b, 0, e - s, s); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); };
  const smol = await loadSmol({ fetchRange, kernel: readFileSync(join(ROOT, '../packages/badecision/kernel/smol_kernel.wasm')) });
  const hj = JSON.parse(readFileSync(join(ROOT, f.head ?? '../packages/core/models/serious/head.json'), 'utf8'));
  const f32 = (b) => new Float32Array(new Uint8Array(Buffer.from(b, 'base64')).buffer);
  const head = makeHead({ ...Object.fromEntries(['mu', 'sd', 'W1', 'b1', 'W2', 'b2'].map((k) => [k, f32(hj[k])])), hidden: hj.hidden, temperature: hj.temperature });
  predict = async (text, horoscope, date) => applyOmens(head(smol.hidden(text)), text, horoscope && horoscope !== 'none' ? parseOmens(horoscope) : [], 1, date).probs;
} else {
  loadEnv();
  const o = { baseUrl: process.env.UNSLOTH_BASEURL, apiKey: process.env.UNSLOTH_API_KEY, model: f.model ?? 'default' };
  predict = (text, horoscope, date) => askDecisionApi(text, { ...o, date: f['no-date'] ? undefined : date, omens: horoscope && horoscope !== 'none' ? horoscope : [] });
}

for (const [name, file] of [['plain', 'data/test.jsonl'], ['omens', 'data/omen-test.jsonl']]) {
  const rows = read(file);
  // rows without a date are asked on Friday 30 October 2026 (--no-date: send no date, for pre-v3 models)
  const preds = await mapLimit(rows, 4, (r) => predict(r.text, r.horoscope, new Date(r.date ?? '2026-10-30T12:00')));
  let ok = 0, nll = 0;
  const per = Object.fromEntries(LABELS.map((l) => [l, { n: 0, ok: 0 }]));
  const misses = [];
  rows.forEach((r, i) => {
    const p = preds[i], v = argmax(p);
    per[r.label].n++;
    if (v === r.label) { ok++; per[r.label].ok++; } else misses.push(`  [${r.label} -> ${v} ${p[v].toFixed(2)}] ${r.date ? `{${new Date(r.date).toDateString().slice(0, 3)}} ` : ''}${r.horoscope ? `(${r.horoscope}) ` : ''}${r.text}`);
    nll -= Math.log(Math.max(p[r.label], 1e-6));
  });
  console.log(`\n${backend} / ${name}: accuracy ${((100 * ok) / rows.length).toFixed(1)}%  nll ${(nll / rows.length).toFixed(3)}  n=${rows.length}`);
  console.log('  recall ' + LABELS.map((l) => `${l} ${per[l].n ? Math.round((100 * per[l].ok) / per[l].n) : '-'}%`).join('  '));
  console.log(misses.slice(0, +(f.show ?? 12)).join('\n'));
}
