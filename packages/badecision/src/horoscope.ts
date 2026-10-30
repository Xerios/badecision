import { readStars as readStarsJs } from '@badecision/core/horoscope';
import { currentSign, defaultState, now, type State } from './config.js';
import type { Horoscope } from './types.js';

const readStars = readStarsJs as (o: { date: Date; sign: string }) => Horoscope & { at: Date; bias: unknown; temperature: number };

export function horoscopeIn(state: State): Horoscope {
  const { at, bias, temperature, ...stars } = readStars({ date: now(state), sign: currentSign(state).name });
  return stars;
}

/** Today's horoscope for your sign: moon, Mercury, the planet ruling the day, omens, and what they all mean. */
export function horoscope(): Horoscope {
  return horoscopeIn(defaultState());
}
