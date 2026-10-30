// Who is asking and when: sun sign (chosen, from a birthday, or random per session), the date, randomness.

import { SIGNS, isSignName, signByName, signOf } from '@badecision/core/horoscope';
import type { Config, DateLike, Sign, SignName } from './types.js';

/** Horoscope strength. Fixed; see Config.astro. */
export const ASTRO = 0.5;
export const ASTRO_WARNING = 'badecision: adjusting astrological influence is only available in the cloud-hosted version of BAdecision.';
const SESSION_KEY = 'badecision:sign';

export interface State {
  config: Omit<Config, 'astro'>;
  /** The default instance keeps its random sign in sessionStorage, so a browser tab keeps its sign across reloads. */
  session: boolean;
  randomSign?: SignName;
}

let warned = false;

export function applyConfig(state: State, config: Config): void {
  const { astro, ...rest } = config as Config & { astro?: unknown };
  if (astro !== undefined && !warned) {
    warned = true;
    console.warn(ASTRO_WARNING);
  }
  if (rest.sign != null) signOf(rest.sign); // throws on anything that is neither a sign nor a date
  if (rest.date != null && Number.isNaN(toDate(rest.date).getTime())) throw new TypeError(`Invalid date: ${rest.date}`);
  state.config = { ...state.config, ...rest };
}

export function newState(config: Config = {}, session = false): State {
  const state: State = { config: {}, session };
  applyConfig(state, config);
  return state;
}

let defaultInstance: State | undefined;
export const defaultState = (): State => (defaultInstance ??= newState({}, true));

const toDate = (d: DateLike): Date => (d instanceof Date ? d : new Date(d));
export const random = (state: State): number => (state.config.random ?? Math.random)();
export const now = (state: State): Date => (state.config.date == null ? new Date() : toDate(state.config.date));
export const ymd = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function sessionStore(state: State): Storage | undefined {
  try {
    return state.session ? globalThis.sessionStorage : undefined;
  } catch {
    return undefined; // sandboxed iframes throw on access
  }
}

function randomSign(state: State): SignName {
  if (state.randomSign) return state.randomSign;
  const store = sessionStore(state);
  let name: string | null | undefined;
  try { name = store?.getItem(SESSION_KEY); } catch { name = undefined; }
  if (!name || !SIGNS.some((s: unknown[]) => s[0] === name)) {
    name = SIGNS[Math.floor(random(state) * SIGNS.length) % SIGNS.length][0] as string;
    try { store?.setItem(SESSION_KEY, name); } catch { /* storage full or disabled: the sign lives in memory only */ }
  }
  return (state.randomSign = name as SignName);
}

type SignInfo = Omit<Sign, 'source'>;
const bySign = (name: string) => signByName(name) as SignInfo;

export function currentSign(state: State): Sign {
  const { sign } = state.config;
  if (sign != null) return { ...(signOf(sign) as SignInfo), source: isSignName(sign) ? 'chosen' : 'birthday' };
  return { ...bySign(randomSign(state)), source: 'random' };
}

/** Change the settings of the default instance. Only the keys you pass change. */
export function configure(config: Config): void {
  applyConfig(defaultState(), config);
}

/** Your sun sign: the sign you chose, the one of your birthday, or one picked at random for this session. */
export function sign(): Sign {
  return currentSign(defaultState());
}
