import { fnv1a } from '@badecision/core/features';
import { moonPhase, mercuryRetrograde } from '@badecision/core/horoscope';
import { currentSign, defaultState, now, ymd, type State } from './config.js';

export function luckyNumberIn(state: State): number {
  const date = now(state);
  let n = (fnv1a(`lucky|${currentSign(state).name}|${ymd(date)}`) % 99) + 1;
  if (moonPhase(date).name === 'Full Moon') n = ((n + 6) % 99) + 1; // the full moon adds 7
  if (mercuryRetrograde(date).retrograde) n = Number(String(n).split('').reverse().join('')); // and Mercury reads it backwards
  return n;
}

/** Today's lucky number (1–99) for your sign. Changes daily; the moon and Mercury have opinions. */
export function luckyNumber(): number {
  return luckyNumberIn(defaultState());
}
