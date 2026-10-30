#!/usr/bin/env node
// Sentences that touch horoscope omen topics (colours, numbers, money, travel, ...), so the decision model sees
// enough cases where an omen applies. Mostly decisions ("Should I paint the door red?"), some facts and predictions.
//   node scripts/generate-omen-sentences.js --per-topic 50 --batch 25 --concurrency 4
// Output: data/omen.candidates.jsonl {"text", "topic"}. Label it with:
//   node scripts/teacher-label.js --in data/omen.candidates.jsonl --out data/omen.teacher.jsonl
// (appends; dedupes against itself and data/teacher.candidates.jsonl; safe to re-run)

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { client, mapLimit, parseJsonLoose, argFlags, ROOT } from './lib/unsloth.js';
import { TOPICS, matchTopics } from '../../core/src/omens.js';

const f = argFlags();
const perTopic = +(f['per-topic'] ?? 50), batch = +(f.batch ?? 25), conc = +(f.concurrency ?? 4);
const out = join(ROOT, 'data', 'omen.candidates.jsonl');
const api = client();

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const mine = read(out);
const seen = new Set([...mine, ...read(join(ROOT, 'data', 'teacher.candidates.jsonl'))].map((r) => r.text.toLowerCase()));
const have = {};
for (const r of mine) have[r.topic] = (have[r.topic] ?? 0) + 1;

const describe = (name, t) => (name === 'today' ? 'today, tonight or tomorrow, without naming the weekday or month (e.g. "Is it a good day to deploy?", "Should I quit my job today?", "Is tonight the night to propose?", "Should we launch tomorrow?")'
  : t.group === 'time' ? `${name} (the weekday or month by name, e.g. "on ${name.replace(/s$/, '')}", "in ${name}", "next ${name.replace(/s$/, '')}")`
  : t.group === 'colour' ? `the colour ${name} (the word "${name}" or clearly ${name} things like ${t.words.slice(1, 6).join(', ')})`
  : t.group === 'number' ? `${name} (write the numbers as digits or words; ${{ 'large numbers': 'amounts of 100 or more, thousands, millions', 'small numbers': 'numbers from 2 to 9', 'odd numbers': 'odd numbers like 3, 7, 15, 21', 'even numbers': 'even numbers like 2, 4, 10, 40', 'the number 7': 'the number 7 / seven', 'the number 13': 'the number 13 / thirteen' }[name]})`
  : `${name} (${t.words.slice(0, 8).join(', ')}, ...)`);

const jobs = [];
const TODAYISH = /\b(today|tonight|this (?:morning|afternoon|evening|day)|right now|a good day|the right day|good time|tomorrow)\b/i;
const targets = [...Object.entries(TOPICS), ['today', { group: 'today', perTopic: perTopic * 4 }]];
for (const [name, t] of targets) for (let i = 0; i < Math.ceil(Math.max(0, (t.perTopic ?? perTopic) - (have[name] ?? 0)) / batch); i++) jobs.push([name, t]);
console.log(`${jobs.length} batches to request`);

let added = 0, offTopic = 0;
await mapLimit(jobs, conc, async ([name, t], i) => {
  try {
    const r = await api.chat({
      ...(f.model ? { model: f.model } : {}),
      temperature: 1.0,
      max_tokens: 2000,
      chat_template_kwargs: { enable_thinking: false },
      messages: [
        { role: 'system', content: 'You create training data. Output only a JSON array of strings, nothing else.' },
        { role: 'user', content: `Write ${batch} different short English sentences (3-14 words) that someone might ask a yes/no oracle, all involving ${describe(name, t)}.
About 60% personal decisions ("Should I ...?", "Is it a good idea to ...?", "Do I ...?"), 20% predictions ("Will ...?"), 20% facts or questions with a clear answer.
Vary the wording and subjects. No numbering. JSON array only. /no_think` },
      ],
    });
    const arr = parseJsonLoose(r.choices?.[0]?.message?.content ?? '[]');
    for (const s of Array.isArray(arr) ? arr : []) {
      const text = String(s).trim();
      if (text.length < 3 || text.length > 160 || seen.has(text.toLowerCase())) continue;
      if (name === 'today' ? !TODAYISH.test(text) : !matchTopics(text).includes(name)) { offTopic++; continue; } // the matcher must agree, or labels would be wrong
      seen.add(text.toLowerCase());
      appendFileSync(out, JSON.stringify({ text, topic: name }) + '\n');
      added++;
    }
  } catch (e) { console.error(`batch ${i} (${name}) failed: ${e.message}`); }
}, (d, n) => process.stdout.write(`${process.stdout.isTTY ? '\r' : '\n'}${d}/${n} batches, +${added} sentences, ${offTopic} dropped as off-topic`));
console.log(`\ndone: +${added} -> data/omen.candidates.jsonl`);
