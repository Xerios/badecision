#!/usr/bin/env node
// A fake Unsloth Studio (OpenAI-compatible subset) for testing the pipeline without the real server.
//   node scripts/mock-unsloth.js --port 8899
//   UNSLOTH_BASEURL=http://localhost:8899 UNSLOTH_API_KEY=sk-unsloth-mock node scripts/probe-unsloth.js
// It "judges" with the tiny model (returns real-looking top_logprobs) and "generates" canned sentences.
// It is NOT smart; it only exercises the plumbing.

import { createServer } from 'node:http';
import { argFlags } from './lib/unsloth.js';
import { createDecider } from '../../core/src/bdm.js';

const f = argFlags();
const port = +(f.port ?? 8899);
const bdm = await createDecider();

const CANNED = {
  yes: ['Bees make honey', 'Is the Nile a river?', 'Cats are not reptiles', 'Snow is white', 'A violin has strings'],
  no: ['The Moon is bigger than the Earth', 'Can fish walk?', 'Water is not wet', 'Trees can sing opera', 'A cow is a bird'],
  maybe: ['The train will be late', 'Should I learn the drums?', 'Jazz is better than rock', 'It will snow next week', 'My code will work'],
  unsure: ['My dentist owns 14 mugs', 'The plorvex is trangly', 'Tuesday is heavier than blue', 'In 2091 it rains in Ghent', 'My cousin dreams of soup'],
};

const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };

createServer(async (req, res) => {
  if (!/^Bearer sk-unsloth-/.test(req.headers.authorization ?? '')) return json(res, 401, { error: 'bad key' });
  let body = '';
  for await (const c of req) body += c;
  const b = body ? JSON.parse(body) : {};
  const url = req.url.split('?')[0];

  if (req.method === 'GET' && url === '/v1/models') return json(res, 200, { data: [{ id: 'mock/tiny-judge' }] });
  if (req.method === 'GET' && url === '/openapi.json') return json(res, 200, { paths: { '/v1/models': { get: {} }, '/v1/chat/completions': { post: {} }, '/api/train/start': { post: {} } } });
  if (req.method === 'POST' && url === '/v1/chat/completions') {
    const user = [...b.messages].reverse().find((m) => m.role === 'user')?.content.replace(' /no_think', '') ?? '';
    const sys = b.messages[0]?.content ?? '';
    if (/JSON array/.test(user)) {
      const label = /clearly YES/.test(user) ? 'yes' : /clearly NO/.test(user) ? 'no' : /MAYBE/.test(user) ? 'maybe' : 'unsure';
      const n = +(user.match(/Write (\d+)/)?.[1] ?? 5);
      const arr = Array.from({ length: n }, (_, i) => `${CANNED[label][i % 5]} (${Math.random().toString(36).slice(2, 6)})`);
      return json(res, 200, { choices: [{ message: { role: 'assistant', content: '```json\n' + JSON.stringify(arr) + '\n```' } }] });
    }
    const p = bdm.decide(user, { astro: 0 }).probs;
    if (/Reply ONLY with JSON/.test(sys)) return json(res, 200, { choices: [{ message: { role: 'assistant', content: JSON.stringify(p) } }] });
    const top = Object.entries(p).map(([k, v]) => ({ token: k === 'unsure' ? 'uns' : k, logprob: Math.log(v * 0.97) })).concat([{ token: 'The', logprob: Math.log(0.03) }]);
    const best = top.reduce((a, x) => (x.logprob > a.logprob ? x : a));
    return json(res, 200, { choices: [{ message: { role: 'assistant', content: best.token }, logprobs: b.logprobs ? { content: [{ token: best.token, logprob: best.logprob, top_logprobs: top }] } : null }] });
  }
  if (req.method === 'POST' && url === '/v1/completions') return json(res, 200, { choices: [{ text: ' yes' }] });
  json(res, 404, { error: 'not found' });
}).listen(port, () => console.log(`mock Unsloth API on http://localhost:${port}`));
