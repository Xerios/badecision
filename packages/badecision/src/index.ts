// BAdecision: a tiny WebAssembly yes / no / maybe model with a horoscope.
// Everything is a named export with no import-time work, so bundlers keep only what you use.

export {
  isIt, isIt as IsIt,
  isItTrue, isItTrue as IsItTrue,
  isItTrueStrict, isItTrueStrict as IsItTrueStrict,
  isItFalse, isItFalse as IsItFalse,
  isItTrulyTrue, isItTrulyTrue as IsItTrulyTrue,
} from './answers.js';
export { decide } from './decide.js';
export { feelingLucky, luckyNumber } from './lucky.js';
export { configure, sign } from './config.js';
export { horoscope } from './ask.js';
export { create, type Badecision } from './create.js';
export { BadDecisionError } from './errors.js';
export { seriously, type Seriously, type LoadOptions, type SeriousInfo } from './serious.js';
export { StringToBooleanFactory } from './string-to-boolean-factory.js';
export type {
  Config, Decide, Decision, NerdyDecision, Horoscope, IsItResult, IsItTrueResult, Omen, Probs, Sign, SignName, Element, Verdict, DateLike,
} from './types.js';
