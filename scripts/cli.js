#!/usr/bin/env node
// Ask the Bad Decision Model from the terminal.
//   node scripts/cli.js "Fire is hot"
//   node scripts/cli.js "Should I buy the boat?" --birthday 1990-08-01 --astro 0.8
//   node scripts/cli.js --astro 0              # interactive, horoscope off
//   echo "Is the earth flat?" | node scripts/cli.js --json

import { createInterface } from 'node:readline';
import { createDecider, LABELS } from '../src/bdm.js';

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, v === undefined || v.startsWith('--') ? 1 : 2); return v === undefined || v.startsWith('--') ? true : v; };
const opts = { astro: +flag('astro', 0.5), birthday: flag('birthday'), date: flag('date') ?? new Date() };
const json = flag('json', false);
const modelUrl = flag('model');

const bdm = await createDecider(modelUrl ? { modelUrl } : {});

const bar = (p) => '█'.repeat(Math.round(p * 30)).padEnd(30, '·');
function show(text) {
  const r = bdm.decide(text, opts);
  if (json) return console.log(JSON.stringify(r));
  console.log(`\n  ${text}\n  → ${r.answer}  (${(r.confidence * 100).toFixed(0)}%)${r.starsChangedIt ? '  ✨ the stars changed the answer' : ''}`);
  for (const l of LABELS) console.log(`    ${l.padEnd(7)} ${bar(r.probs[l])} ${(r.probs[l] * 100).toFixed(1).padStart(5)}%   (model ${(r.model[l] * 100).toFixed(1)}%)`);
  if (r.stars) for (const n of r.stars.notes) console.log('    ' + n);
}

const text = argv.filter((a) => !a.startsWith('--')).join(' ');
if (text) show(text);
else if (!process.stdin.isTTY) { for await (const line of createInterface({ input: process.stdin })) if (line.trim()) show(line.trim()); }
else {
  const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: '\nask> ' });
  rl.prompt();
  rl.on('line', (l) => { if (l.trim()) show(l.trim()); rl.prompt(); });
}
