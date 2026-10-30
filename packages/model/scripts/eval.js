#!/usr/bin/env node
// Evaluate a model on the test set handwritten by a human AI (or any jsonl with {text,label} or {text,probs}).
//   node scripts/eval.js                                  # tiny model, data/test.jsonl
//   node scripts/eval.js --model models/exp-big/model.bin --data data/seed.val.jsonl
//   node scripts/eval.js --llm [--llm-model <id>] [--mode logprobs]   # evaluate the Studio LLM via the API instead
//   node scripts/eval.js --astro 1 --date 2026-10-30      # how much do the stars hurt accuracy?

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { argFlags, ROOT, client, mapLimit } from './lib/unsloth.js';
import { evaluate, formatReport } from './lib/metrics.js';
import { LABELS } from '../../core/src/features.js';
import { createDecider } from '../../core/src/bdm.js';

const f = argFlags();
const rows = readFileSync(join(ROOT, f.data ?? 'data/test.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => {
  const r = JSON.parse(l);
  return { text: r.text, label: r.label ?? LABELS[r.probs.indexOf(Math.max(...r.probs))] };
});

let predictor;
if (f.llm) {
  const { makeJudge } = await import('./lib/teacher.js');
  const judge = makeJudge(client(), { mode: f.mode ?? 'auto', model: f['llm-model'], fewshot: f.fewshot !== 'false' });
  const cache = new Map();
  await mapLimit(rows, +(f.concurrency ?? 4), async (r) => cache.set(r.text, (await judge(r.text)).probs ?? { yes: 0.25, no: 0.25, maybe: 0.25, unsure: 0.25 }), (d, n) => process.stderr.write(`${process.stderr.isTTY ? '\r' : ' '}${d}/${n}`));
  process.stderr.write('\n');
  predictor = { predict: (t) => cache.get(t) };
} else {
  const bdm = await createDecider(f.model ? { modelUrl: join(ROOT, f.model) } : {});
  const astro = +(f.astro ?? 0);
  predictor = { predict: (t) => bdm.decide(t, { astro, date: f.date ?? new Date(), sign: f.birthday }).probs };
}
console.log(formatReport(evaluate(predictor, rows), { showMistakes: +(f.mistakes ?? 15) }));
