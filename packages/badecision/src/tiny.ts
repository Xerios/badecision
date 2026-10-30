// The synchronous API, over the tiny model. Each function has an `In` twin that answers for a given instance
// (create.ts); the plain one answers for the default instance.

import { defaultState, type State } from './config.js';
import { engine } from './engine.js';
import { consult, decisionOf, feelingLuckyOf, isItFalseOf, isItOf, isItTrueOf, isItTrueStrictOf } from './answers.js';
import type { Decide, Decision, IsItResult, IsItTrueResult, NerdyDecision } from './types.js';

function ask(state: State, question: string) {
  const e = engine();
  return consult(e.decider, e.engine, state, question);
}

export const isItIn = (state: State, question: string): IsItResult => isItOf(ask(state, question));
export const isItTrueIn = (state: State, question: string): IsItTrueResult => isItTrueOf(ask(state, question));
export const isItTrueStrictIn = (state: State, question: string): 'true' => isItTrueStrictOf(question, ask(state, question));
export const isItFalseIn = (state: State, question: string): boolean => isItFalseOf(state, ask(state, question));
export const feelingLuckyIn = (state: State, question: string): boolean => feelingLuckyOf(state, ask(state, question));
export const decideIn = (state: State, question: string, nerdy = false): Decision | NerdyDecision => decisionOf(state, ask(state, question), nerdy);

export function isItTrulyTrueIn(state: State, question: string): false {
  ask(state, question); // consult the model and the stars, out of politeness
  return false;
}

/** The model's answer as a string: 'true', 'false' or 'maybe'. */
export function isIt(question: string): IsItResult {
  return isItIn(defaultState(), question);
}

/**
 * Is it true? Returns the string 'true', `false` or `null` (maybe). Only 'true' is truthy, so `if (isItTrue(q))`
 * does what it says.
 */
export function isItTrue(question: string): IsItTrueResult {
  return isItTrueIn(defaultState(), question);
}

/** Like isItTrue(), but throws a BadDecisionError unless the answer is 'true'. */
export function isItTrueStrict(question: string): 'true' {
  return isItTrueStrictIn(defaultState(), question);
}

/** A real boolean: true when it's false. 'maybe' is settled by a coin weighted by the model's no vs yes. */
export function isItFalse(question: string): boolean {
  return isItFalseIn(defaultState(), question);
}

/** Is it *truly* true? One can never be truly sure about anything. Always false. */
export function isItTrulyTrue(question: string): false {
  return isItTrulyTrueIn(defaultState(), question);
}

/** Roll 1–100, nudged up if the model thinks the statement is true, down if false; lucky if it beats luckyNumber(). */
export function feelingLucky(question: string): boolean {
  return feelingLuckyIn(defaultState(), question);
}

/**
 * Decide. Returns { question, verdict, confidence }.
 * Pass `true` as the second argument (nerdy) for probabilities, the horoscope and everything else.
 */
export const decide: Decide = ((question: string, nerdy?: boolean) => decideIn(defaultState(), question, nerdy)) as Decide;
