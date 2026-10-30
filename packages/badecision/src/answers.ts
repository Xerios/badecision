import { defaultState, random, type State } from './config.js';
import { ask } from './ask.js';
import { BadDecisionError } from './errors.js';
import type { IsItResult, IsItTrueResult, Verdict } from './types.js';

const RESULTS: Record<Verdict, IsItResult> = { yes: 'true', no: 'false', maybe: 'maybe', unsure: 'maybe' };
const TRUE_RESULTS: Record<Verdict, IsItTrueResult> = { yes: 'true', no: false, maybe: null, unsure: null };

export const isItIn = (state: State, question: string): IsItResult => RESULTS[ask(state, question).result.verdict];
export const isItTrueIn = (state: State, question: string): IsItTrueResult => TRUE_RESULTS[ask(state, question).result.verdict];

export function isItTrueStrictIn(state: State, question: string): 'true' {
  const result = isItIn(state, question);
  if (result !== 'true') throw new BadDecisionError(question, result);
  return result;
}

export function isItFalseIn(state: State, question: string): boolean {
  const { result } = ask(state, question);
  const answer = RESULTS[result.verdict];
  if (answer !== 'maybe') return answer === 'false';
  const { yes, no } = result.probs;
  return random(state) * (yes + no) < no;
}

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
