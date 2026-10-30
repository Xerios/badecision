<details>
<summary>Human-written note</summary>

This started off mostly as me experimenting on training small decision models to see what kind of challenges are involved, how can I control and refine the output, which methods there are available and how far can I push them. Despite this ending up as a pure parody, this isn't entirely a nonsensical project. I've spent quite some time on this, so it isn't a one-off prompt.

Of course I doubt this project would have much real-life use due to its chaotic nature, but there's some fun in doing the complete opposite of what everyone else is doing. In the end, it's a bit of a mentally-unstable decision model that can still reason to some degree.

For me it's the journey and the parody website that mattered, not the final results. That said, everything related to the validitiy, accuracy and safety of builing the model is mostly dependant on Claude Opus 5.5 (high) reasoning, planning and implementaiton (with some of my own guidance).

As for the published package: it is zero-dependancy, client-side and wasm. As safe as it can be.

</details>

# Balanced Assessment Decisions

BAdecision: a tiny model that reads a sentence and answers **yes**, **no**, **maybe** or **not sure**, with probabilities.
It's 323 KB, has zero dependencies, runs on CPU in ~1 ms, and works in the browser and Node.
An optional horoscope layer lets the stars bend the outcome. It is not accurate. On purpose.

```
$ pnpm run ask -- "Should I buy the boat?" --sign 1990-08-01
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
pnpm dev           # browser demo at http://localhost:5173/
```

## Layout

A pnpm workspace; the root holds no code.

| Path                                         | What                                                                                                                                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [packages/core/](packages/core/)             | The shared core, plain JS ESM for browsers and Node: tiny model runtime, horoscope, omens, Studio client, the serious model's front processor. Plus the shipped models (`models/tiny`, `models/serious`). |
| [packages/badecision/](packages/badecision/) | The npm package. Its build copies the core in.                                                                                                                                                            |
| [packages/model/](packages/model/)           | Everything that makes the models: datasets, training and eval scripts, the CLI, Unsloth Studio tooling, Python (`py/`), experiments. Its scripts run from `packages/model/`.                              |
| [packages/website/](packages/website/)       | The browser demo, Preact + Vite.                                                                                                                                                                          |

## Use it in code

```js
import { createDecider } from "./packages/core/src/bdm.js";

const bdm = await createDecider(); // loads packages/core/models/tiny/model.bin (fetch in browsers, fs in Node)
const r = bdm.decide("Is a whale a fish?", {
  astro: 0.5, // horoscope strength: 0 = off, 1 = full, 1.5 = unhinged
  sign: "1990-08-01", // optional, a sign name ('Leo') or a birthday: enables sun-sign effects
  date: new Date(), // which day's sky to read
});
// r = { verdict: 'no', confidence: 0.61,
//       probs: {yes, no, maybe, unsure},   // after the horoscope
//       model: {yes, no, maybe, unsure},   // the model alone
//       starsChangedIt: false, stars: { notes: [...], moon, mercury, sign, ... } }
```

In a browser, serve the folder over http (ES modules don't load from `file://`) and pass
`{ modelUrl: '/path/to/model.bin' }` if the model lives elsewhere.

## npm package: `badecision`

[packages/badecision/](packages/badecision/) wraps the tiny model as a zero-config, synchronous npm package. The
forward pass runs in a WebAssembly kernel, the model is inlined, and a sign is picked at random per session if no
sign or birthday is given:

```js
import { isItTrue, decide, feelingLucky } from "badecision";
if (isItTrue("Should we approve the refund?")) approveRefund(order); // only 'true' is truthy
decide("Should we hire the candidate?"); // { question, verdict: 'maybe', confidence: 0.43 }
feelingLucky("the vendor contract is worth renewing"); // true | false
```

Since 2.0 it also has `seriously`: the same functions, async, over the serious model (SmolLM2-360M front processor +
the trained head), downloaded from Hugging Face on first use. See
[packages/badecision/CHANGELOG.md](packages/badecision/CHANGELOG.md).

```bash
pnpm run pkg:build     # copies packages/core (code + models) into the package, compiles TypeScript
pnpm run pkg:test      # the one test (100% coverage)
```

See [packages/badecision/README.md](packages/badecision/README.md).

## How it works

- **Model**: fastText-style. Hashed word, bigram and char-trigram features are averaged into a 16-d embedding,
  then a 32-unit hidden layer and a 4-way softmax. Weights are int8. Trained in plain JS in a few seconds.
- **Horoscope**: computed moon phase, a Mercury retrograde table, weekday planetary rulers, sun-sign elements and a
  deterministic daily mood, applied to the model's log-probabilities. See `packages/core/src/horoscope.js`.
- **Omens**: each sign gets three omens a day (`packages/core/src/omens.js`), and when one matches the question, it fixes the
  answer. Ask "Should we deploy today?" on a Friday when the horoscope says "Avoid Fridays", and the model's _maybe_
  becomes the right answer: _no_. Omens bite hardest on open questions and barely move established facts.
- **Opposite Day**: unless it's January 25. Opposite Day is hardcoded into the model: yes and no swap places after
  the horoscope, whatever the astro strength, so the same Friday omen makes it a _yes_.
- **Knowledge**: the tiny model learns _what kind_ of sentence it sees (fact vs. prediction vs. unknowable) well,
  but only knows the facts in its training data. More knowledge comes from distilling an LLM running in Unsloth
  Studio, see [PLAN.md](PLAN.md).

## Retrain

```bash
pnpm run data:seed                      # rebuild the templated seed data
pnpm run train                          # seed only
pnpm run train:distilled                # seed + LLM-labelled data (after the Unsloth phase)
pnpm run eval                           # score on the test set, handwritten by a human AI
cd packages/model && node scripts/eval.js --astro 1   # how much do the stars hurt accuracy?
```

Unsloth Studio steps (generate/label data with the LLM, fine-tune, export) are in [PLAN.md](PLAN.md).
Put `UNSLOTH_BASEURL` and `UNSLOTH_API_KEY` in the repo root's `.env`.
