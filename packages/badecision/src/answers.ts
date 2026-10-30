// What each function makes of a decision. Shared by the tiny model (tiny.ts, sync) and the serious one (serious.ts,
// async), so the two APIs can't drift apart. Nothing here touches a model, so neither drags the other into a bundle.

import { ASTRO, currentSign, now, random, ymd, type State } from './config.js';
import { luckyNumberIn } from './lucky.js';
import { BadDecisionError } from './errors.js';
import type { Decision, IsItResult, IsItTrueResult, NerdyDecision, Omen, Probs, Sign, Verdict } from './types.js';

// the typed face of @badecision/core/decider
export interface CoreDecision {
  text: string; verdict: Verdict; confidence: number; probs: Probs; model: Probs;
  oppositeDay: boolean; starsChangedIt: boolean | null; omenHits: Omen[];
  stars: { notes: string[] }; // never null here: the horoscope strength is fixed above 0
}
export interface Decider {
  decide(text: string, options: { astro: number; sign: string; date: Date }): CoreDecision;
}

/** One question put to a model: its decision, and who asked on which day. */
export interface Asked { r: CoreDecision; sign: Sign; date: Date; engine: NerdyDecision['engine'] }

export function consult(decider: Decider, engine: Asked['engine'], state: State, question: string): Asked {
  const sign = currentSign(state);
  const date = now(state);
  return { r: decider.decide(String(question), { astro: ASTRO, sign: sign.name, date }), sign, date, engine };
}

const RESULTS: Record<Verdict, IsItResult> = { yes: 'true', no: 'false', maybe: 'maybe', unsure: 'maybe' };
const TRUE_RESULTS: Record<Verdict, IsItTrueResult> = { yes: 'true', no: false, maybe: null, unsure: null };

export const isItOf = ({ r }: Asked): IsItResult => RESULTS[r.verdict];
export const isItTrueOf = ({ r }: Asked): IsItTrueResult => TRUE_RESULTS[r.verdict];

export function isItTrueStrictOf(question: string, asked: Asked): 'true' {
  const result = isItOf(asked);
  if (result !== 'true') throw new BadDecisionError(question, result);
  return result;
}

/** 'maybe' is settled by a coin weighted by the model's no vs yes. */
export function isItFalseOf(state: State, asked: Asked): boolean {
  const result = isItOf(asked);
  if (result !== 'maybe') return result === 'false';
  const { yes, no } = asked.r.probs;
  return random(state) * (yes + no) < no;
}

/** Roll 1–100, nudged up by yes and down by no; lucky if it beats today's lucky number. */
export function feelingLuckyOf(state: State, { r: { probs } }: Asked): boolean {
  const roll = 1 + Math.floor(random(state) * 100) + Math.round((probs.yes - probs.no) * 40);
  return Math.min(100, Math.max(1, roll)) > luckyNumberIn(state);
}

export function decisionOf(state: State, { r, sign, date, engine }: Asked, nerdy: boolean): Decision | NerdyDecision {
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
