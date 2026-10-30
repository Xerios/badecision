import { fnv1a } from './core/features.js';
import { moonPhase, mercuryRetrograde } from './core/horoscope.js';
import { currentSign, defaultState, now, random, ymd, type State } from './config.js';
import { ask } from './ask.js';

export function luckyNumberIn(state: State): number {
  const date = now(state);
  let n = (fnv1a(`lucky|${currentSign(state).name}|${ymd(date)}`) % 99) + 1;
  if (moonPhase(date).name === 'Full Moon') n = ((n + 6) % 99) + 1; // the full moon adds 7
  if (mercuryRetrograde(date).retrograde) n = Number(String(n).split('').reverse().join('')); // and Mercury reads it backwards
  return n;
}

export function feelingLuckyIn(state: State, question: string): boolean {
  const { probs } = ask(state, question).result;
  const roll = 1 + Math.floor(random(state) * 100) + Math.round((probs.yes - probs.no) * 40);
  return Math.min(100, Math.max(1, roll)) > luckyNumberIn(state);
}

/** Today's lucky number (1–99) for your sign. Changes daily; the moon and Mercury have opinions. */
export function luckyNumber(): number {
  return luckyNumberIn(defaultState());
}

/** Roll 1–100, nudged up if the model thinks the statement is true, down if false; lucky if it beats luckyNumber(). */
export function feelingLucky(question: string): boolean {
  return feelingLuckyIn(defaultState(), question);
}
