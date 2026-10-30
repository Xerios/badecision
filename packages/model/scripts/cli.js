#!/usr/bin/env node
// Ask BAdecision from the terminal.
//   node scripts/cli.js "Fire is hot"
//   node scripts/cli.js "Should I buy the boat?" --sign 1990-08-01 --astro 0.8   # a sign name or a birthday
//   node scripts/cli.js "Should I buy the red car?" --horoscope "Avoid red today."
//   node scripts/cli.js "Should I buy the red car?" --backend studio   # the decision model in Unsloth Studio (.env)
//   node scripts/cli.js --astro 0              # interactive, horoscope off
//   echo "Is the earth flat?" | node scripts/cli.js --json

import { createInterface } from 'node:readline';
import { createDecider, createStudioDecider, LABELS } from '../../core/src/bdm.js';
import { loadEnv } from './lib/unsloth.js';

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, v === undefined || v.startsWith('--') ? 1 : 2); return v === undefined || v.startsWith('--') ? true : v; };
const opts = { astro: +flag('astro', 0.5), sign: flag('sign'), date: flag('date') ?? new Date(), horoscope: flag('horoscope') };
const json = flag('json', false);
const modelUrl = flag('model');

const backend = flag('backend', 'tiny');
if (backend === 'studio') loadEnv();
const bdm = backend === 'studio'
  ? createStudioDecider({ baseUrl: process.env.UNSLOTH_BASEURL, apiKey: process.env.UNSLOTH_API_KEY, model: flag('decision-model', 'default') })
  : await createDecider(modelUrl ? { modelUrl } : {});

const ANSWERS = { yes: 'Yes.', no: 'No.', maybe: 'Maybe.', unsure: 'Not sure.' };
const bar = (p) => '█'.repeat(Math.round(p * 30)).padEnd(30, '·');
async function show(text) {
  const r = await bdm.decide(text, opts);
  if (json) return console.log(JSON.stringify(r));
  console.log(`\n  ${text}\n  → ${ANSWERS[r.verdict]}  (${(r.confidence * 100).toFixed(0)}%)${r.oppositeDay ? '  🙃 it is Opposite Day' : r.starsChangedIt ? '  ✨ the stars changed the answer' : ''}`);
  for (const l of LABELS) console.log(`    ${l.padEnd(7)} ${bar(r.probs[l])} ${(r.probs[l] * 100).toFixed(1).padStart(5)}%   (model ${(r.model[l] * 100).toFixed(1)}%)`);
  if (r.stars) for (const n of r.stars.notes) console.log('    ' + n);
  for (const o of r.omenHits ?? []) console.log(`    ↳ "${o.text}" applies: this is about ${o.topic}`);
}

const text = argv.filter((a) => !a.startsWith('--')).join(' ');
if (text) await show(text);
else if (!process.stdin.isTTY) { for await (const line of createInterface({ input: process.stdin })) if (line.trim()) await show(line.trim()); }
else {
  const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: '\nask> ' });
  rl.prompt();
  rl.on('line', async (l) => { if (l.trim()) await show(l.trim()); rl.prompt(); });
}
