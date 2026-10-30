#!/usr/bin/env node
// Training data for the Unsloth decision model: {state, questions, gold} rows (Studio "Train as: Decision model").
//   node scripts/build-decision-dataset.js [--data a.jsonl,b.jsonl] [--horoscope-copies 1] [--match-copies 2] [--eval-frac 0.05]
// Every sentence appears once without a horoscope and --horoscope-copies times with a random one. Omens that
// match the sentence are picked often (70%), and the gold label is what applyOmens makes of the teacher's
// probabilities, so the model learns to read the horoscope exactly like the tiny model's rules do (and, being
// a real language model, to generalise beyond their word lists). Sentences that touch an omen topic get
// --match-copies extra horoscopes with a matching omen guaranteed. data/test.jsonl is never used.
// Output: data/decision/{train,eval}.jsonl

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { argFlags, ROOT } from './lib/unsloth.js';
import { LABELS, fnv1a } from '../../core/src/features.js';
import { TOPICS, KINDS, matchTopics, omenText, applyOmens } from '../../core/src/omens.js';
import { QUESTIONS, decisionState } from '../../core/src/decision.js';

const f = argFlags();
const files = (f.data ?? 'data/teacher.jsonl,data/omen.teacher.jsonl,data/seed.train.jsonl').split(',');
const copies = +(f['horoscope-copies'] ?? 1), matchCopies = +(f['match-copies'] ?? 2), evalFrac = +(f['eval-frac'] ?? 0.05);

let seed = 7;
const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
const pick = (a) => a[Math.floor(rand() * a.length)];
// every row is asked on some day of 2027 (the state says "Today: Friday in October"; omens about today follow it)
const randomDate = () => new Date(2027, 0, 1 + Math.floor(rand() * 365), 12);
const argmax = (p) => LABELS.reduce((a, l) => (p[l] > p[a] ? l : a), LABELS[0]);

// horoscope small talk that is not an omen: the model must learn to ignore it
const FILLER = ['Your energy is high today.', 'A stranger may surprise you.', 'The moon asks for patience.', 'Trust your instincts.',
  'Venus smiles on your plans.', 'Rest is important this week.', 'An old friend thinks of you.', 'Expect the unexpected.',
  'Your intuition is sharp.', 'Small steps lead far.', 'Mars gives you courage.', 'Listen more than you speak.'];

const topics = Object.keys(TOPICS), kinds = Object.keys(KINDS);
function randomHoroscope(text, date, forceMatch = false) {
  const matched = matchTopics(text, date);
  const n = 1 + Math.floor(rand() * 3);
  const omens = [], used = new Set();
  for (let i = 0; i < n; i++) {
    const useMatch = i === 0 && matched.length && (forceMatch || rand() < 0.7);
    let topic; do topic = useMatch ? pick(matched) : pick(topics); while (used.has(topic) && used.size < topics.length);
    used.add(topic);
    const kind = rand() < 0.42 ? 'avoid' : rand() < 0.72 ? 'favour' : 'clouded';
    omens.push({ kind, topic, text: omenText(kind, topic, Math.floor(rand() * 5)) });
  }
  // shuffle in 0-2 filler lines so omens aren't always first
  const lines = [...omens];
  for (let k = Math.floor(rand() * 3); k > 0; k--) lines.splice(Math.floor(rand() * (lines.length + 1)), 0, { text: pick(FILLER) });
  return { omens, lines };
}

const rows = [];
const seen = new Set();
for (const file of files) {
  const p = join(ROOT, file);
  if (!existsSync(p)) { console.warn(`skip missing ${file}`); continue; }
  for (const line of readFileSync(p, 'utf8').split('\n').filter(Boolean)) {
    const r = JSON.parse(line);
    const key = r.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const arr = r.probs ?? (r.label ? LABELS.map((l) => (l === r.label ? 1 : 0)) : null);
    if (!arr) continue;
    const probs = Object.fromEntries(LABELS.map((l, i) => [l, arr[i]]));
    const split = (fnv1a(key) % 1000) / 1000 < evalFrac ? 'eval' : 'train';
    rows.push({ split, state: decisionState(r.text, [], randomDate()), gold: argmax(probs), omen: false });
    const extra = matchTopics(r.text, randomDate()).length ? matchCopies : 0;
    for (let c = 0; c < copies + extra; c++) {
      const date = randomDate();
      const { omens, lines } = randomHoroscope(r.text, date, c >= copies);
      const { probs: shifted, hits } = applyOmens(probs, r.text, omens, 1, date);
      rows.push({ split, state: decisionState(r.text, lines.map((x) => x.text).join(' '), date), gold: argmax(shifted), omen: hits.length > 0, flipped: argmax(shifted) !== argmax(probs) });
    }
  }
}

mkdirSync(join(ROOT, 'data', 'decision'), { recursive: true });
const stats = {};
for (const split of ['train', 'eval']) {
  const part = rows.filter((r) => r.split === split);
  for (let i = part.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [part[i], part[j]] = [part[j], part[i]]; }
  writeFileSync(join(ROOT, 'data', 'decision', `${split}.jsonl`), part.map((r) => JSON.stringify({ state: r.state, questions: QUESTIONS, gold: { verdict: r.gold } })).join('\n') + '\n');
  stats[split] = { rows: part.length, omenApplies: part.filter((r) => r.omen).length, omenFlips: part.filter((r) => r.flipped).length,
    gold: Object.fromEntries(LABELS.map((l) => [l, part.filter((r) => r.gold === l).length])) };
}
console.log(JSON.stringify(stats, null, 1));
console.log('example:', JSON.stringify(rows.find((r) => r.flipped)?.state));
