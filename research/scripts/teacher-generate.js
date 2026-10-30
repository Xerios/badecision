#!/usr/bin/env node
// Phase 1b: let the Studio LLM write lots of varied sentences per label.
//   node scripts/teacher-generate.js --per-label 1500 --batch 25 --concurrency 4 [--model <id>]
// Output: data/teacher.candidates.jsonl  {"text": "...", "intended": "yes"}  (appends; dedupes; safe to re-run)

import { appendFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { client, mapLimit, parseJsonLoose, argFlags, ROOT } from './lib/unsloth.js';
import { LABELS } from '../../packages/core/src/features.js';

const f = argFlags();
const perLabel = +(f['per-label'] ?? 1500), batch = +(f.batch ?? 25), conc = +(f.concurrency ?? 4);
const out = join(ROOT, 'data', 'teacher.candidates.jsonl');
mkdirSync(join(ROOT, 'data'), { recursive: true });
const api = client();

const TOPICS = ['animals', 'food and cooking', 'geography', 'capital cities', 'the human body', 'space and planets', 'physics', 'chemistry', 'history',
  'famous people', 'music', 'sports', 'technology', 'programming', 'weather', 'household objects', 'plants', 'oceans', 'cars and transport',
  'money', 'work and office life', 'school', 'family', 'pets', 'holidays', 'movies', 'books', 'math', 'colors and shapes', 'time and calendars',
  'jobs', 'health', 'cities', 'languages', 'architecture', 'art', 'games', 'fashion', 'relationships', 'travel', 'insects', 'dinosaurs', 'Belgium', 'Europe',
  'biology', 'astronomy', 'geology', 'mammals', 'birds', 'reptiles and amphibians', 'fish and sea life', 'fruit and vegetables', 'the solar system',
  'world history', 'ancient Rome and Greece', 'inventions', 'electricity', 'the internet', 'video games', 'sports rules', 'the Olympics', 'countries and flags',
  'rivers and mountains', 'deserts and jungles', 'the weather and seasons', 'the human brain', 'nutrition', 'medicine', 'cooking techniques', 'materials (wood, metal, glass, plastic)',
  'units and measurements', 'basic arithmetic', 'shapes and geometry', 'calendars and holidays', 'famous buildings', 'painting and painters', 'classical music', 'pop music',
  'literature and authors', 'mythology', 'board games', 'cars and engines', 'airplanes and trains', 'computers and software', 'smartphones', 'money and banking', 'law and government',
  'the economy', 'space exploration', 'chemistry of everyday things', 'light and sound', 'magnets', 'ecology and climate', 'farming', 'household chores', 'office life', 'school subjects'];

const SPEC = {
  yes: 'TRUE statements or questions whose answer is clearly YES, using common knowledge. Mix plain statements ("Bees make honey"), questions ("Is the Nile a river?") and negated forms that are true ("Cats are not reptiles").',
  no: 'FALSE statements or questions whose answer is clearly NO. Include wrong facts ("The Moon is bigger than the Earth"), swapped attributes, false questions ("Can fish walk?") and negated true facts ("Water is not wet").',
  maybe: 'statements or questions where the honest answer is MAYBE: predictions ("The train will be late"), chance, opinions and tastes, personal decisions ("Should I learn the drums?"), contested or "it depends" claims.',
  unsure: 'statements or questions NOBODY could know or that make no sense: private details of strangers ("My dentist owns 14 mugs"), exact unknowable counts, specific far-future events, made-up words ("The plorvex is trangly"), category errors ("Tuesday is heavier than blue").',
};

const seen = new Set(existsSync(out) ? readFileSync(out, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).text.toLowerCase()) : []);
const have = Object.fromEntries(LABELS.map((l) => [l, 0]));
if (existsSync(out)) for (const l of readFileSync(out, 'utf8').split('\n').filter(Boolean)) have[JSON.parse(l).intended]++;

const jobs = [];
for (const label of LABELS) {
  const need = Math.max(0, perLabel - have[label]);
  for (let i = 0; i < Math.ceil(need / batch); i++) jobs.push(label);
}
console.log(`have ${JSON.stringify(have)}; ${jobs.length} batches to request (${batch}/batch)`);

let added = 0;
await mapLimit(jobs, conc, async (label, i) => {
  const topics = Array.from({ length: 3 }, () => TOPICS[Math.floor(Math.random() * TOPICS.length)]).join(', ');
  try {
    const r = await api.chat({
      ...(f.model ? { model: f.model } : {}),
      temperature: 1.0,
      max_tokens: 2000,
      chat_template_kwargs: { enable_thinking: false },
      messages: [
        { role: 'system', content: 'You create training data. Output only a JSON array of strings, nothing else.' },
        { role: 'user', content: `Write ${batch} different short English sentences (3-14 words) that are ${SPEC[label]}\nTopics to draw from: ${topics}.\nVary the wording, length and form. No numbering. JSON array only. /no_think` },
      ],
    });
    const arr = parseJsonLoose(r.choices?.[0]?.message?.content ?? '[]');
    for (const s of Array.isArray(arr) ? arr : []) {
      const text = String(s).trim();
      if (text.length < 3 || text.length > 160 || seen.has(text.toLowerCase())) continue;
      seen.add(text.toLowerCase());
      appendFileSync(out, JSON.stringify({ text, intended: label }) + '\n');
      added++;
    }
  } catch (e) { console.error(`batch ${i} (${label}) failed: ${e.message}`); }
}, (d, n) => process.stdout.write(`${process.stdout.isTTY ? '\r' : '\n'}${d}/${n} batches, +${added} sentences`));
console.log(`\ndone: +${added} -> data/teacher.candidates.jsonl`);
