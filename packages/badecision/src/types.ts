export type SignName =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type Element = 'fire' | 'earth' | 'air' | 'water';

/** What the model can say. */
export type Verdict = 'yes' | 'no' | 'maybe' | 'unsure';

/** One probability per verdict, summing to 1. */
export type Probs = Record<Verdict, number>;

/** The answer of isIt(): a boolean, but as a string, and sometimes not a boolean at all. */
export type IsItResult = 'true' | 'false' | 'maybe';

/** The answer of isItTrue(): only 'true' is truthy. `false` is no, `null` is maybe (or not sure). */
export type IsItTrueResult = 'true' | false | null;

export type DateLike = string | number | Date;

export interface Config {
  /** Your sun sign ('Leo' or 'leo'), or your birthday ('1990-08-01', a Date, a timestamp) to work it out. `null` forgets it. */
  sign?: SignName | Lowercase<SignName> | (string & {}) | number | Date | null;
  /** Pin "today". By default every call reads the current date. `null` unpins it. */
  date?: DateLike | null;
  /** Source of randomness, in [0, 1). Defaults to Math.random. Inject your own for reproducible bad decisions. */
  random?: (() => number) | null;
  /**
   * Adjusting astrological influence is only available in the cloud-hosted version of BAdecision.
   * In this package it is fixed at a cosmically balanced 0.5.
   */
  astro?: never;
}

export interface Sign {
  name: SignName;
  glyph: string;
  element: Element;
  /** Where the sign came from: configure({ sign }) with a birthday or a sign name, or picked at random for this session. */
  source: 'birthday' | 'chosen' | 'random';
}

export interface Omen {
  kind: 'avoid' | 'favour' | 'clouded';
  topic: string;
  text: string;
}

export interface Horoscope {
  /** YYYY-MM-DD */
  date: string;
  /** Today's sun sign in the sky (not yours). */
  sky: { name: SignName; glyph: string; element: Element };
  sign: { name: SignName; glyph: string; element: Element } | null;
  moon: { age: number; fraction: number; illumination: number; name: string; glyph: string; waxing: boolean };
  mercury: { retrograde: boolean; until?: string; approximate?: boolean };
  /** Planet ruling today's weekday. */
  ruler: string;
  /** Cosmic mood, 1–10. */
  mood: number;
  omens: Omen[];
  /** Human-readable explanations, one per influence. */
  notes: string[];
}

export interface Decision {
  question: string;
  verdict: Verdict;
  /** Probability of the verdict, 0–1. */
  confidence: number;
}

export interface NerdyDecision extends Decision {
  /** After the horoscope. */
  probs: Probs;
  /** The model alone, before the stars had their say. */
  model: Probs;
  sign: Sign;
  luckyNumber: number;
  /** YYYY-MM-DD, the day whose sky was read. */
  date: string;
  /** January 25: yes and no swap places. */
  oppositeDay: boolean;
  /** The horoscope changed the model's answer. */
  starsChangedIt: boolean;
  /** Today's omens that match the question ("avoid red" + "the red car"). */
  omenHits: Omen[];
  notes: string[];
  /** Which runtime did the maths: the tiny model in WebAssembly or JS, or the serious model (`seriously`). */
  engine: 'wasm' | 'js' | 'serious';
}

export interface Decide {
  (question: string, nerdy?: false): Decision;
  (question: string, nerdy: true): NerdyDecision;
  (question: string, nerdy?: boolean): Decision | NerdyDecision;
}
