import { readStars as readStarsJs } from './core/horoscope.js';
import { currentSign, defaultState, now, type State } from './config.js';
import { engine } from './engine.js';
import type { Horoscope } from './types.js';

const readStars = readStarsJs as (o: { date: Date; sign: string }) => Horoscope & { at: Date; bias: unknown; temperature: number };

/** Horoscope strength. Fixed; see Config.astro. */
export const ASTRO = 0.5;

/** Run the model + horoscope for a question, as the given instance. */
export function ask(state: State, question: string) {
  const e = engine();
  const sign = currentSign(state);
  const date = now(state);
  const result = e.decider.decide(String(question), { astro: ASTRO, sign: sign.name, date });
  return { result, sign, date, engine: e.engine };
}

export function horoscopeIn(state: State): Horoscope {
  const { at, bias, temperature, ...stars } = readStars({ date: now(state), sign: currentSign(state).name });
  return stars;
}

/** Today's horoscope for your sign: moon, Mercury, the planet ruling the day, omens, and what they all mean. */
export function horoscope(): Horoscope {
  return horoscopeIn(defaultState());
}
