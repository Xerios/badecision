#!/usr/bin/env node
// Step 0 of the Unsloth phase: find out what the Studio instance can do.
//   node scripts/probe-unsloth.js            -> prints a report and writes studio/probe-report.json + studio/openapi.json
// Checks: reachability/auth, loaded models, chat, logprobs support, completions, and any
// training / dataset / export routes exposed in /openapi.json (undocumented, may exist in your version).

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { client, ROOT, argFlags } from './lib/unsloth.js';
import { messages } from './lib/teacher.js';

const flags = argFlags();
const api = client();
const report = { baseUrl: api.baseUrl, at: new Date().toISOString() };
const ok = (k, v) => { report[k] = v; console.log(`✔ ${k}:`, typeof v === 'object' ? JSON.stringify(v).slice(0, 400) : v); };
const bad = (k, e) => { report[k] = { error: String(e?.message ?? e) }; console.log(`✘ ${k}: ${String(e?.message ?? e).slice(0, 300)}`); };
mkdirSync(join(ROOT, 'studio'), { recursive: true });

console.log(`Probing ${api.baseUrl} ...\n`);
try {
  const m = await api.models();
  ok('models', (m.data ?? m).map?.((x) => x.id ?? x) ?? m);
} catch (e) { bad('models', e); if (/ECONNREFUSED|fetch failed|ENOTFOUND|EHOSTUNREACH|allowlist|403/.test(String(e?.message) + String(e?.cause))) { console.log('\nServer unreachable. Check UNSLOTH_BASEURL, that Studio is running, and the network allowlist.');
  if ((process.env.HTTPS_PROXY || process.env.HTTP_PROXY) && !process.env.NODE_USE_ENV_PROXY) console.log('A proxy is configured but Node fetch ignores it. Retry with:\n  NO_PROXY= no_proxy= NODE_USE_ENV_PROXY=1 pnpm run unsloth:probe'); } }

// /v1/models lists everything installed; prefer what's actually loaded (Studio-specific route, optional)
try { report.loadedModels = (await api.get('/api/inference/loaded-models')).data?.filter((x) => x.loaded).map((x) => x.id); } catch { /* not Studio */ }
const model = flags.model ?? report.loadedModels?.[0] ?? (Array.isArray(report.models) ? report.models[0] : undefined);
if (report.loadedModels && !report.loadedModels.length) console.log('⚠ no model loaded in Studio: load a text LLM first');
if (model) console.log(`(using model: ${model})`);

try {
  const spec = await api.get('/openapi.json');
  writeFileSync(join(ROOT, 'studio', 'openapi.json'), JSON.stringify(spec, null, 2));
  const paths = Object.entries(spec.paths ?? {}).flatMap(([p, ops]) => Object.keys(ops).map((m) => `${m.toUpperCase()} ${p}`));
  ok('routeCount', paths.length);
  const interesting = paths.filter((p) => /train|dataset|finetun|fine_tun|job|export|lora|adapter|install|download|hub|upload|recipe|gguf|checkpoint|load|model/i.test(p));
  ok('trainingRelatedRoutes', interesting);
} catch (e) { bad('openapi', e); }

try {
  const r = await api.chat({ model, messages: [{ role: 'user', content: 'Reply with the single word OK. /no_think' }], max_tokens: 20, temperature: 0, chat_template_kwargs: { enable_thinking: false } });
  ok('chat', (r.choices?.[0]?.message?.content ?? '').trim());
  if (/<think>/.test(r.choices?.[0]?.message?.content ?? '')) report.thinkingLeaks = true;
} catch (e) { bad('chat', e); }

try {
  const r = await api.chat({ model, messages: messages('Fire is hot'), max_tokens: 1, temperature: 0, logprobs: true, top_logprobs: 10, chat_template_kwargs: { enable_thinking: false } });
  const top = r.choices?.[0]?.logprobs?.content?.[0]?.top_logprobs;
  if (top?.length) ok('chatLogprobs', top.map((t) => `${JSON.stringify(t.token)}:${Math.exp(t.logprob).toFixed(3)}`));
  else bad('chatLogprobs', 'response has no logprobs (judge will fall back to json mode)');
} catch (e) { bad('chatLogprobs', e); }

try {
  const r = await api.completions({ model, prompt: 'Q: Is fire hot? Answer yes or no.\nA:', max_tokens: 1, temperature: 0, logprobs: 5 });
  ok('completions', r.choices?.[0]?.text ?? r);
  const lp = r.choices?.[0]?.logprobs;
  const top = lp?.top_logprobs?.[0] ?? lp?.content?.[0]?.top_logprobs;
  if (top) ok('completionLogprobs', Array.isArray(top) ? top.map((t) => `${JSON.stringify(t.token)}:${Math.exp(t.logprob).toFixed(3)}`) : Object.entries(top).map(([t, l]) => `${JSON.stringify(t)}:${Math.exp(l).toFixed(3)}`));
  else bad('completionLogprobs', 'no logprobs in /v1/completions response');
} catch (e) { bad('completions', e); }

for (const p of ['/v1/props', '/api/health', '/health']) {
  try { ok(`GET ${p}`, await api.get(p)); } catch (e) { report[`GET ${p}`] = { error: String(e.message) }; }
}

writeFileSync(join(ROOT, 'studio', 'probe-report.json'), JSON.stringify(report, null, 2));
console.log('\nwrote studio/probe-report.json' + (report.routeCount ? ' and studio/openapi.json' : ''));
console.log(`\nJudge method that will work: ${report.chatLogprobs && !report.chatLogprobs.error ? 'logprobs (best)' : report.chat && !report.chat.error ? 'json' : 'none - fix connectivity first'}`);
