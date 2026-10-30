// The decision step, without any model loading. Shared by src/bdm.js (async loaders, Studio backend)
// and the badecision npm package (inlined weights + WASM), so neither pulls in fs or fetch code it doesn't need.

import { LABELS } from './features.js';
import { readStars, applyStars, isOppositeDay, applyOppositeDay } from './horoscope.js';
import { matchTopics } from './omens.js';

export const ANSWERS = { yes: 'Yes.', no: 'No.', maybe: 'Maybe.', unsure: 'Not sure.' };

const argmax = (p) => LABELS.reduce((a, l) => (p[l] > p[a] ? l : a), LABELS[0]);

// shared by both backends: horoscope mood (+ omens, unless the model already read them), Opposite Day, verdict
export function finish(text, model, withOmens, stars, astro, { date, oppositeDay, omensApplied }) {
  const opposite = oppositeDay && isOppositeDay(date);
  let probs = stars ? applyStars(withOmens, stars, astro, { text, omensApplied }) : withOmens;
  if (opposite) probs = applyOppositeDay(probs);
  const topics = new Set(matchTopics(text, date));
  const verdict = argmax(probs);
  return {
    text,
    verdict,
    answer: ANSWERS[verdict],
    confidence: probs[verdict],
    probs,
    model, // the model's own answer, no horoscope
    oppositeDay: opposite,
    // the horoscope flipped the model's answer
    starsChangedIt: stars && !opposite ? verdict !== argmax(model) : false,
    stars,
    omenHits: stars ? stars.omens.filter((o) => topics.has(o.topic)) : [],
  };
}

/**
 * Options for decide():
 * @typedef {object} DecideOptions
 * @property {number} [astro=0.5]        horoscope strength, 0 disables it
 * @property {string|Date} [birthday]    enables sun-sign effects
 * @property {string} [sign]             a sun sign name ('Leo'), used when there is no birthday
 * @property {string|Date} [date]        defaults to now
 * @property {string} [horoscope]        your own horoscope text; its omens ("avoid red") replace the generated ones
 * @property {boolean} [oppositeDay=true] on January 25 yes and no swap places
 */

/**
 * The tiny model's decide(), sync. Omens are applied by rule (src/omens.js).
 * @param {{ predict(text: string): Record<string, number> }} m  a loaded model (TinyModel or compatible)
 */
export function makeDecider(m) {
  /** @param {string} text @param {DecideOptions} [o] */
  function decide(text, { astro = 0.5, birthday, sign, date = new Date(), horoscope, oppositeDay = true } = {}) {
    const p = m.predict(text);
    const stars = astro ? readStars({ date, birthday, sign, horoscope }) : null;
    return finish(text, p, p, stars, astro, { date, oppositeDay, omensApplied: false });
  }
  return { decide, model: m };
}
