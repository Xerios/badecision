// Asking an LLM (served by Unsloth Studio) for a probability over yes / no / maybe / unsure.
//
// Three strategies, tried in this order by mode 'auto':
//   logprobs  - one-token answer, read top_logprobs of the first token (best: real probabilities, 1 call)
//   completion- same, but via /v1/completions with the prompt rendered as ChatML by us (Studio's chat
//               endpoint rejects logprobs; its llama.cpp completions endpoint returns them). ChatML models only.
//   json      - ask the model to output {"yes":..,"no":..,"maybe":..,"unsure":..} (works everywhere, noisier)
//   sample    - ask N times at temperature 1 and count (slow, last resort)
// The same SYSTEM prompt is used for fine-tuning in Studio (export-studio-dataset.js), so a fine-tuned
// model answers in exactly this format.

import { LABELS } from '../../../core/src/features.js';
import { parseJsonLoose } from './unsloth.js';

export const SYSTEM = `You judge statements and questions. Answer with exactly one word:
yes    - it is true / the answer is yes
no     - it is false / the answer is no
maybe  - plausible but uncertain: predictions, chance, opinions, personal decisions, contested claims
unsure - nobody could know, or it can't be true or false at all: private information about specific people, exact unknowable
         numbers, specific future events, unprovable big questions, made-up words, and nonsense / category errors
         (comparing things that can't be compared, like days with colours). Absurd is unsure, not no.`;

const FEWSHOT = [
  ['Fire is hot', 'yes'], ['Penguins can fly', 'no'], ['It will rain tomorrow', 'maybe'],
  ['My neighbour is thinking about pasta right now', 'unsure'], ['Is a whale a fish?', 'no'],
  ['Pineapple belongs on pizza', 'maybe'], ['The glorbix is flumpy', 'unsure'], ['Is Paris in France?', 'yes'],
  ['Monday is saltier than the colour purple', 'unsure'], ['Napoleon had a cat named Pierre', 'unsure'], ['Do you like my haircut?', 'maybe'],
];

export function messages(text, { fewshot = true, thinkOff = true } = {}) {
  const m = [{ role: 'system', content: SYSTEM }];
  if (fewshot) for (const [q, a] of FEWSHOT) m.push({ role: 'user', content: q }, { role: 'assistant', content: a });
  m.push({ role: 'user', content: thinkOff ? `${text} /no_think` : text });
  return m;
}

// "Yes", " yes", "YES", "Un" (prefix of unsure) ... -> label
function tokenToLabel(tok) {
  const t = String(tok).replace(/<think>|<\/think>/g, '').trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!t) return null;
  if ('yes'.startsWith(t) && t.length >= 1 && t[0] === 'y') return 'yes';
  if (t === 'no' || t === 'n') return 'no';
  if ('maybe'.startsWith(t) && t.length >= 2) return 'maybe';
  if (('unsure'.startsWith(t) && t.length >= 2) || t === 'not' || t === 'unknown') return 'unsure';
  return null;
}

function normalize(p) {
  const s = LABELS.reduce((a, l) => a + (p[l] ?? 0), 0);
  if (!(s > 0)) return null;
  return Object.fromEntries(LABELS.map((l) => [l, (p[l] ?? 0) / s]));
}

const extraBody = (o) => ({
  // llama.cpp-style backends accept this to disable Qwen3-style thinking; others ignore unknown fields
  chat_template_kwargs: { enable_thinking: false },
  ...(o.model ? { model: o.model } : {}),
});

export async function viaLogprobs(api, text, o = {}) {
  const r = await api.chat({ ...extraBody(o), messages: messages(text, o), max_tokens: 1, temperature: 0, logprobs: true, top_logprobs: 20 });
  const lp = r?.choices?.[0]?.logprobs?.content?.[0];
  if (!lp?.top_logprobs?.length) return null;
  const p = { yes: 0, no: 0, maybe: 0, unsure: 0 };
  let mass = 0;
  for (const { token, logprob } of lp.top_logprobs) {
    const l = tokenToLabel(token);
    const pr = Math.exp(logprob);
    if (l) { p[l] += pr; mass += pr; }
  }
  if (mass < 0.2) return null; // model wasn't answering in our format
  return { probs: normalize(p), mass, method: 'logprobs' };
}

// first-token top logprobs from an OpenAI- or llama.cpp-style completions response -> [{token, logprob}]
function topFromCompletion(r) {
  const lp = r?.choices?.[0]?.logprobs;
  const top = lp?.content?.[0]?.top_logprobs ?? lp?.top_logprobs?.[0];
  if (!top) return null;
  return Array.isArray(top) ? top : Object.entries(top).map(([token, logprob]) => ({ token, logprob }));
}

const chatml = (msgs) => msgs.map((m) => `<|im_start|>${m.role}\n${m.content}<|im_end|>\n`).join('')
  + '<|im_start|>assistant\n<think>\n\n</think>\n\n'; // empty think block = thinking off (Qwen3.x)

let chatmlServer; // cached per process: does /v1/props report a ChatML template?
async function isChatml(api) {
  chatmlServer ??= api.get('/v1/props').then((p) => /<\|im_start\|>/.test(p?.chat_template ?? ''), () => false);
  return chatmlServer;
}

export async function viaCompletion(api, text, o = {}) {
  if (!(await isChatml(api))) return null;
  const r = await api.completions({ ...(o.model ? { model: o.model } : {}), prompt: chatml(messages(text, { ...o, thinkOff: false })), max_tokens: 1, temperature: 0, logprobs: 20 });
  const top = topFromCompletion(r);
  if (!top?.length) return null;
  const p = { yes: 0, no: 0, maybe: 0, unsure: 0 };
  let mass = 0;
  for (const { token, logprob } of top) {
    const l = tokenToLabel(token);
    const pr = Math.exp(logprob);
    if (l) { p[l] += pr; mass += pr; }
  }
  if (mass < 0.2) return null;
  return { probs: normalize(p), mass, method: 'completion' };
}

export async function viaJson(api, text, o = {}) {
  const r = await api.chat({
    ...extraBody(o),
    temperature: 0,
    max_tokens: 120,
    messages: [
      { role: 'system', content: SYSTEM.replace('Answer with exactly one word:', 'Give a probability for each answer:') + '\nReply ONLY with JSON like {"yes":0.1,"no":0.7,"maybe":0.15,"unsure":0.05}. The numbers must sum to 1.' },
      { role: 'user', content: `${text} /no_think` },
    ],
  });
  const content = r?.choices?.[0]?.message?.content ?? '';
  const j = parseJsonLoose(content);
  const probs = normalize(Object.fromEntries(LABELS.map((l) => [l, Math.max(0, +j[l] || 0)])));
  return probs ? { probs, method: 'json' } : null;
}

export async function viaSampling(api, text, o = {}, n = 8) {
  const counts = { yes: 0.25, no: 0.25, maybe: 0.25, unsure: 0.25 }; // add-one-ish smoothing
  for (let i = 0; i < n; i++) {
    const r = await api.chat({ ...extraBody(o), messages: messages(text, o), max_tokens: 4, temperature: 1 });
    const l = tokenToLabel((r?.choices?.[0]?.message?.content ?? '').split(/\s+/).find(Boolean) ?? '');
    if (l) counts[l]++;
  }
  return { probs: normalize(counts), method: 'sample' };
}

/** mode: auto | logprobs | completion | json | sample. In auto, the first strategy that works is remembered. */
export function makeJudge(api, { mode = 'auto', model, fewshot = true } = {}) {
  let chosen = mode === 'auto' ? null : mode;
  const fns = { logprobs: viaLogprobs, completion: viaCompletion, json: viaJson, sample: viaSampling };
  return async function judge(text) {
    const o = { model, fewshot };
    if (chosen) {
      const r = await fns[chosen](api, text, o).catch((e) => ({ error: e.message }));
      if (r && !r.error) return r;
      if (mode !== 'auto') return { error: r?.error ?? 'no answer', probs: null };
    }
    for (const m of ['logprobs', 'completion', 'json', 'sample']) {
      const r = await fns[m](api, text, o).catch(() => null);
      if (r) { if (mode === 'auto' && !chosen) { chosen = m; console.error(`[judge] using method: ${m}`); } return r; }
    }
    return { error: 'all methods failed', probs: null };
  };
}
