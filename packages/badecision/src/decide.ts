import { defaultState, ymd, type State } from './config.js';
import { ask } from './ask.js';
import { luckyNumberIn } from './lucky.js';
import type { Decide, Decision, NerdyDecision } from './types.js';

export function decideIn(state: State, question: string, nerdy = false): Decision | NerdyDecision {
  const { result: r, sign, date, engine } = ask(state, question);
  const decision: Decision = { question: r.text, verdict: r.verdict, confidence: r.confidence };
  if (!nerdy) return decision;
  return {
    ...decision,
    probs: r.probs,
    model: r.model,
    sign,
    luckyNumber: luckyNumberIn(state),
    date: ymd(date),
    oppositeDay: r.oppositeDay,
    starsChangedIt: Boolean(r.starsChangedIt),
    omenHits: r.omenHits,
    notes: r.stars.notes,
    engine,
  };
}

/**
 * Decide. Returns { question, verdict, confidence }.
 * Pass `true` as the second argument (nerdy) for probabilities, the horoscope and everything else.
 */
export const decide: Decide = ((question: string, nerdy?: boolean) => decideIn(defaultState(), question, nerdy)) as Decide;
