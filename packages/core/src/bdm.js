// BAdecision: public API. Works in the browser and in Node (ESM).
//
//   import { createDecider } from './src/bdm.js';
//   const bdm = await createDecider();
//   bdm.decide('Fire is hot');
//   bdm.decide('Should I buy the boat?', { sign: '1990-08-01', astro: 0.7 });   // sign: a sign name or a birthday
//   bdm.decide('Should I buy the red car?', { horoscope: 'Avoid red today.' });   // your own horoscope text
//
//   const smart = createStudioDecider({ baseUrl: 'http://<studio-ip>:8888', apiKey });   // the decision model
//   await smart.decide('Should I buy the red car?', { horoscope: 'Avoid red today.' });

import { LABELS } from './features.js';
import { TinyModel } from './model.js';
import { loadModel } from './load.js';
import { readStars, applyStars, isOppositeDay } from './horoscope.js';
import { matchTopics, parseOmens, dailyOmens, decisionState } from './omens.js';
import { askDecisionApi, QUESTIONS } from './decision.js';
import { finish, makeDecider } from './decider.js';

export { LABELS, makeDecider, loadModel, TinyModel, readStars, applyStars, isOppositeDay, matchTopics, parseOmens, dailyOmens, decisionState, askDecisionApi, QUESTIONS };

const DEFAULT_MODEL = new URL('../models/tiny/model.bin', import.meta.url);
/**
 * The tiny model: pure JS, ~1 ms, runs anywhere. Omens are applied by rule (src/omens.js).
 * @param {object} [o]
 * @param {string|URL} [o.modelUrl]  where model.bin lives (defaults to ../models/tiny/model.bin next to this file)
 * @param {TinyModel}  [o.model]     an already-loaded model
 */
export async function createDecider({ modelUrl = DEFAULT_MODEL, model } = {}) {
  return makeDecider(model ?? (await loadModel(modelUrl)));
}

/**
 * The decision model (Unsloth Studio, POST /v1/systemone): knows far more, and reads the horoscope itself.
 * decide() is async here. The omens go into the model's input; mood and Opposite Day are applied afterwards.
 * @param {object} o
 * @param {string} o.baseUrl   Studio URL, e.g. http://<studio-ip>:8888
 * @param {string} [o.apiKey]
 * @param {string} [o.model='default']  Decision API model name ('default' = whatever Studio has selected)
 */
export function createStudioDecider({ baseUrl, apiKey, model = 'default', fetchImpl } = {}) {
  const ask = (text, omens, date) => askDecisionApi(text, { baseUrl, apiKey, model, omens, date, fetchImpl });
  /** @param {string} text @param {import('./decider.js').DecideOptions} [o] */
  async function decide(text, { astro = 0.5, sign, date = new Date(), horoscope, oppositeDay = true } = {}) {
    const stars = astro ? readStars({ date, sign, horoscope }) : null;
    const [plain, withOmens] = await Promise.all([ask(text, [], date), stars ? ask(text, horoscope ?? stars.omens, date) : null]);
    return finish(text, plain, withOmens ?? plain, stars, astro, { date, oppositeDay, omensApplied: true });
  }
  return { decide };
}
