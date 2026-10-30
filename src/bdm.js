// Bad Decision Model: public API. Works in the browser and in Node (ESM).
//
//   import { createDecider } from './src/bdm.js';
//   const bdm = await createDecider();
//   bdm.decide('Fire is hot');
//   bdm.decide('Should I buy the boat?', { birthday: '1990-08-01', astro: 0.7 });

import { LABELS } from './features.js';
import { loadModel, TinyModel } from './model.js';
import { readStars, applyStars } from './horoscope.js';

export { LABELS, loadModel, TinyModel, readStars, applyStars };

export const ANSWERS = { yes: 'Yes.', no: 'No.', maybe: 'Maybe.', unsure: 'Not sure.' };

const DEFAULT_MODEL = new URL('../models/tiny/model.bin', import.meta.url);

/**
 * @param {object} [o]
 * @param {string|URL} [o.modelUrl]  where model.bin lives (defaults to ../models/tiny/model.bin next to this file)
 * @param {TinyModel}  [o.model]     an already-loaded model
 */
export async function createDecider({ modelUrl = DEFAULT_MODEL, model } = {}) {
  const m = model ?? (await loadModel(modelUrl));

  /**
   * @param {string} text
   * @param {object} [o]
   * @param {number} [o.astro=0.5]    horoscope strength, 0 disables it
   * @param {string|Date} [o.birthday] enables sun-sign effects
   * @param {string|Date} [o.date]     defaults to now
   */
  function decide(text, { astro = 0.5, birthday, date = new Date() } = {}) {
    const model = m.predict(text);
    const stars = astro ? readStars({ date, birthday }) : null;
    const probs = stars ? applyStars(model, stars, astro) : model;
    const verdict = LABELS.reduce((a, l) => (probs[l] > probs[a] ? l : a), LABELS[0]);
    return {
      text,
      verdict,
      answer: ANSWERS[verdict],
      confidence: probs[verdict],
      probs,
      model,
      // the horoscope flipped the model's answer
      starsChangedIt: stars ? verdict !== LABELS.reduce((a, l) => (model[l] > model[a] ? l : a), LABELS[0]) : false,
      stars,
    };
  }

  return { decide, model: m };
}
