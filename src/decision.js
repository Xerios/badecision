// The decision-model contract, shared by training-data export, evaluation and runtime:
// one "choice" question over yes / no / maybe / unsure, asked about decisionState(text, omens).
// Unsloth Studio trains this with "Train as: Decision model" and serves it at POST /v1/systemone.

import { LABELS } from './features.js';
import { decisionState } from './omens.js';

export { decisionState };

export const QUESTIONS = {
  verdict: {
    type: 'choice',
    instructions: 'Judge the question or statement. If the horoscope has an omen about something the question involves (including today\'s weekday or month), follow the omen.',
    criteria: {
      yes: 'true, or the answer is yes',
      no: 'false, or the answer is no',
      maybe: 'plausible but uncertain: predictions, chance, opinions, personal decisions, contested claims',
      unsure: 'nobody could know: private information, exact unknowable numbers, specific future events, nonsense or made-up words',
    },
  },
};

/** Ask a Studio Decision API (POST /v1/systemone). omens: omen list or raw horoscope text; date: "today". Returns {yes,no,maybe,unsure}. */
export async function askDecisionApi(text, { baseUrl, apiKey, model = 'default', omens = [], date, fetchImpl = fetch, loadWaitMs = 300000 } = {}) {
  const until = Date.now() + loadWaitMs;
  for (;;) {
    const res = await fetchImpl(`${baseUrl.replace(/\/+$/, '')}/v1/systemone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      body: JSON.stringify({ model, state: decisionState(text, omens, date), questions: QUESTIONS }),
    });
    if (res.ok) {
      const p = (await res.json()).answers?.verdict?.probabilities ?? {};
      return Object.fromEntries(LABELS.map((l) => [l, +p[l] || 0]));
    }
    const body = await res.text();
    // the model loads on first use (can take a minute or more): wait for it
    if (res.status === 503 && /model_loading/.test(body) && Date.now() < until) { await new Promise((r) => setTimeout(r, 5000)); continue; }
    throw new Error(`decision API ${res.status}: ${body.slice(0, 200)}`);
  }
}
