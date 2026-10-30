# Bad Decision Model

A tiny model that reads a sentence and answers **yes**, **no**, **maybe** or **not sure**, with probabilities.
It's 323 KB, has zero dependencies, runs on CPU in ~1 ms, and works in the browser and Node.
An optional horoscope layer lets the stars bend the outcome. It is not accurate. On purpose.

```
$ pnpm run ask -- "Should I buy the boat?" --birthday 1990-08-01
  → Maybe.  (49%)
    yes     ████··························  13.0%
    no      ████··························  14.0%
    maybe   ███████████████···············  49.0%
    unsure  ███████·······················  24.0%
    ☿ Mercury is retrograde (until 2026-11-13): nothing is certain, the model hedges.
    🌖 Waning Gibbous: a shrinking moon favours no.
    ...
```

## Quick start

```bash
pnpm test          # offline self-checks
pnpm run ask       # interactive CLI   (or: pnpm run ask -- "Fire is hot" --astro 0)
pnpm run demo      # browser demo at http://localhost:5173/web/
```

## Use it in code

```js
import { createDecider } from './src/bdm.js';   // or 'bad-decision-model' once packaged

const bdm = await createDecider();               // loads models/tiny/model.bin (fetch in browsers, fs in Node)
const r = bdm.decide('Is a whale a fish?', {
  astro: 0.5,              // horoscope strength: 0 = off, 1 = full, 1.5 = unhinged
  birthday: '1990-08-01',  // optional, enables sun-sign effects
  date: new Date(),        // which day's sky to read
});
// r = { verdict: 'no', answer: 'No.', confidence: 0.61,
//       probs: {yes, no, maybe, unsure},   // after the horoscope
//       model: {yes, no, maybe, unsure},   // the model alone
//       starsChangedIt: false, stars: { notes: [...], moon, mercury, sign, ... } }
```

In a browser, serve the folder over http (ES modules don't load from `file://`) and pass
`{ modelUrl: '/path/to/model.bin' }` if the model lives elsewhere.

## How it works

* **Model**: fastText-style. Hashed word, bigram and char-trigram features are averaged into a 16-d embedding,
  then a 32-unit hidden layer and a 4-way softmax. Weights are int8. Trained in plain JS in a few seconds.
* **Horoscope**: computed moon phase, a Mercury retrograde table, weekday planetary rulers, sun-sign elements and a
  deterministic daily mood, applied to the model's log-probabilities. See `src/horoscope.js`.
* **Knowledge**: the tiny model learns *what kind* of sentence it sees (fact vs. prediction vs. unknowable) well,
  but only knows the facts in its training data. More knowledge comes from distilling an LLM running in Unsloth
  Studio, see [PLAN.md](PLAN.md).

## Retrain

```bash
pnpm run data:seed                      # rebuild the templated seed data
pnpm run train                          # seed only
pnpm run train:distilled                # seed + LLM-labelled data (after the Unsloth phase)
pnpm run eval                           # score on the hand-written test set
node scripts/eval.js --astro 1         # how much do the stars hurt accuracy?
```

Unsloth Studio steps (generate/label data with the LLM, fine-tune, export) are in [PLAN.md](PLAN.md).
Put `UNSLOTH_BASEURL` and `UNSLOTH_API_KEY` in `.env`.
