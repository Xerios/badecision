import { applyConfig, currentSign, newState } from './config.js';
import { horoscopeIn } from './ask.js';
import { isItIn, isItTrueIn, isItTrueStrictIn, isItFalseIn, isItTrulyTrueIn } from './answers.js';
import { feelingLuckyIn, luckyNumberIn } from './lucky.js';
import { decideIn } from './decide.js';
import type { Config, Decide, Horoscope, IsItResult, IsItTrueResult, Sign } from './types.js';

export interface Badecision {
  configure(config: Config): void;
  decide: Decide;
  isIt(question: string): IsItResult;
  isItTrue(question: string): IsItTrueResult;
  isItTrueStrict(question: string): 'true';
  isItFalse(question: string): boolean;
  isItTrulyTrue(question: string): false;
  feelingLucky(question: string): boolean;
  luckyNumber(): number;
  sign(): Sign;
  horoscope(): Horoscope;
}

/**
 * A separate instance with its own settings, e.g. one per user on a server.
 * Without a sign it gets its own random sign (not shared with the default instance).
 */
export function create(config: Config = {}): Badecision {
  const state = newState(config);
  return {
    configure: (c) => applyConfig(state, c),
    decide: ((q: string, nerdy?: boolean) => decideIn(state, q, nerdy)) as Decide,
    isIt: (q) => isItIn(state, q),
    isItTrue: (q) => isItTrueIn(state, q),
    isItTrueStrict: (q) => isItTrueStrictIn(state, q),
    isItFalse: (q) => isItFalseIn(state, q),
    isItTrulyTrue: (q) => isItTrulyTrueIn(state, q),
    feelingLucky: (q) => feelingLuckyIn(state, q),
    luckyNumber: () => luckyNumberIn(state),
    sign: () => currentSign(state),
    horoscope: () => horoscopeIn(state),
  };
}
