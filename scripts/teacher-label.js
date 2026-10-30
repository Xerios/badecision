#!/usr/bin/env node
// Phase 1c / 3b: have the Studio LLM (base or fine-tuned) assign probabilities to sentences.
//   node scripts/teacher-label.js                                    # labels data/teacher.candidates.jsonl
//   node scripts/teacher-label.js --in data/seed.train.jsonl --out data/teacher.seed.jsonl --alpha 0.5
//   options: --mode auto|logprobs|completion|json|sample  --concurrency 4  --alpha 0.7  --model <id>  --limit 100
//
// alpha blends teacher with the intended/seed label: probs = alpha*teacher + (1-alpha)*intended.
// (1.0 = trust the teacher fully; rows without an intended label always use the teacher.)
// Resumable: already-labelled texts in --out are skipped.

import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { client, mapLimit, argFlags, ROOT } from './lib/unsloth.js';
import { makeJudge } from './lib/teacher.js';
import { LABELS } from '../src/features.js';

const f = argFlags();
const inFile = join(ROOT, f.in ?? 'data/teacher.candidates.jsonl');
const outFile = join(ROOT, f.out ?? 'data/teacher.jsonl');
const alpha = +(f.alpha ?? 0.7), conc = +(f.concurrency ?? 4);
const judge = makeJudge(client(), { mode: f.mode ?? 'auto', model: f.model, fewshot: f.fewshot !== 'false' });

const SOFT = { yes: [0.9, 0.02, 0.05, 0.03], no: [0.02, 0.9, 0.05, 0.03], maybe: [0.1, 0.1, 0.7, 0.1], unsure: [0.03, 0.03, 0.14, 0.8] };
const done = new Set(existsSync(outFile) ? readFileSync(outFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).text) : []);
let rows = readFileSync(inFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => !done.has(r.text));
if (f.limit) rows = rows.slice(0, +f.limit);
console.log(`${rows.length} rows to label (${done.size} already done) -> ${f.out ?? 'data/teacher.jsonl'}`);

let failed = 0, disagree = 0;
await mapLimit(rows, conc, async (r) => {
  const j = await judge(r.text);
  if (!j?.probs) { failed++; return; }
  const t = LABELS.map((l) => j.probs[l]);
  const prior = r.probs ?? (r.intended ? SOFT[r.intended] : r.label ? SOFT[r.label] : null);
  const probs = prior ? t.map((x, i) => alpha * x + (1 - alpha) * prior[i]) : t;
  const am = (a) => a.indexOf(Math.max(...a));
  if (prior && am(t) !== am(prior)) disagree++;
  appendFileSync(outFile, JSON.stringify({ text: r.text, probs: probs.map((x) => +x.toFixed(4)), src: 'teacher', teacher: t.map((x) => +x.toFixed(4)), method: j.method, intended: r.intended ?? r.label }) + '\n');
}, (d, n) => process.stdout.write(`${process.stdout.isTTY ? '\r' : '\n'}${d}/${n}  failed ${failed}  teacher-disagrees-with-intended ${disagree}`));
console.log(`\ndone. Rows where the teacher disagreed with the intended label are kept but blended; inspect with:\n  node -e "require('fs').readFileSync('${f.out ?? 'data/teacher.jsonl'}','utf8').split('\\n').filter(Boolean).map(JSON.parse).filter(r=>r.intended&&r.teacher.indexOf(Math.max(...r.teacher))!==['yes','no','maybe','unsure'].indexOf(r.intended)).slice(0,30).forEach(r=>console.log(r.intended,r.teacher,r.text))"`);
