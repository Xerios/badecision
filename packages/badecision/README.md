# BAdecision

**Balanced Assessment Decisions.** Decisions as a service, without the service.

A tiny neural network that reads a question and answers _yes_, _no_, _maybe_ or _not sure_. Its forward pass
runs in WebAssembly and its judgement is adjusted by today's horoscope. It works in the browser and in Node, has
zero dependencies and needs zero configuration, and it is wrong on purpose often enough to be useful.

**New in 2.0:** [`seriously`](#seriously--the-same-functions-async-with-a-real-model), the same API backed by a real
language model, for when it matters. See the [changelog](CHANGELOG.md).

![coverage 100%](https://img.shields.io/badge/coverage-100%25-brightgreen)
![tests 1](https://img.shields.io/badge/tests-1-blue)
![WebAssembly](https://img.shields.io/badge/runtime-WebAssembly-654ff0)
![dependencies 0](https://img.shields.io/badge/dependencies-0-brightgreen)
![types included](https://img.shields.io/badge/types-TypeScript-3178c6)

```js
import { isItTrue, decide, feelingLucky } from "badecision";

if (isItTrue("Should we approve the refund?")) approveRefund(order);
decide("Should we hire the candidate?");
// { question: 'Should we hire the candidate?', verdict: 'maybe', confidence: 0.43 }
if (feelingLucky("the vendor contract is worth renewing"))
  renewVendorContract();
```

---

## Install

```bash
npm install badecision     # or: pnpm add badecision / yarn add badecision / bun add badecision
```

ESM only, standard web APIs only. Tested in Node and Chromium. Deno, Bun and web workers should just work. Edge
runtimes that forbid compiling WebAssembly at runtime (e.g. Cloudflare Workers) get the plain-JS fallback
automatically. In Node you can also `require('badecision')` (via require(esm), Node ≥ 20.19 / 22.12).

## What happens when you import it

Nothing, until you call a function. On the first call:

1. **The date is read.** Every call asks "what day is it?" again, so a long-running server moves on at midnight.
2. **Your sign is chosen.** If you configured a sign or a birthday, that's your sun sign. Otherwise a sign is **picked at random
   for the session**. In a browser it's kept in `sessionStorage`, so a tab keeps its sign across reloads. In Node it
   lasts as long as the process.
3. **The model wakes up.** The 323 KB of int8 weights are decoded from the bundle and handed to a 3.5 KB WebAssembly
   kernel. The kernel is small enough to compile synchronously, so every function in this library is synchronous.
   No `await`, no loading state, no spinner. This takes about 20 ms once; after that each answer takes about
   20 microseconds.

## API

All functions take a question (or statement) as a plain string.

### `isIt(question)` → `'true' | 'false' | 'maybe'`

The model's answer as a string. _Not sure_ is reported as `'maybe'`.

```js
isIt("Fire is hot"); // 'true'
isIt("Is a whale a fish?"); // 'false'
isIt("Will it rain on 3 March 2031?"); // 'maybe' (for 11 of the 12 signs)
```

### `isItTrue(question)` → `'true' | false | null`

Is it true? Only a _yes_ is truthy, so `if (isItTrue('...'))` runs exactly when the model says yes. A _yes_ is the
string `'true'`, a _no_ is a real `false`, and _maybe_ / _not sure_ is `null`: a boolean that is sometimes a string,
and occasionally not a boolean at all.

```js
if (isItTrue("Should we approve the refund?")) approveRefund(order); // runs only on 'true'
isItTrue("Should we renew the vendor contract?"); // null: maybe, ask again tomorrow
```

To turn `isIt()`'s strings into real booleans, use the [`StringToBooleanFactory`](#stringtobooleanfactory) (since 2.0.1).

### `isItTrueStrict(question)` → `'true'`

Like `isItTrue()`, but for when you need certainty. It returns `'true'` or throws a `BadDecisionError`.

```js
try {
  isItTrueStrict("The candidate passed the technical interview");
  sendOffer(candidate);
} catch (e) {
  if (e instanceof BadDecisionError) console.log(e.result); // 'false' or 'maybe'
}
```

### `isItFalse(question)` → `boolean`

A real boolean, the opposite of `isItTrue()`. A `'maybe'` is settled by a coin weighted by the model's probabilities
of _no_ versus _yes_.

### `isItTrulyTrue(question)` → `false`

Is it _truly_ true? One can never be truly sure about anything. It always returns `false`. It still consults the
model and the stars first, out of politeness.

### `decide(question, nerdy?)` → `object`

A small JSON-safe object:

```js
decide("Should we hire the candidate?");
// { question: 'Should we hire the candidate?', verdict: 'maybe', confidence: 0.43 }
```

`verdict` is `'yes' | 'no' | 'maybe' | 'unsure'`. `confidence` is the probability of the verdict.

Pass `true` as the second argument (nerdy mode) for everything else:

```js
decide("Should I deploy on Friday?", true);
// {
//   question, verdict, confidence,
//   probs:  { yes: 0.13, no: 0.13, maybe: 0.49, unsure: 0.26 },  // after the horoscope
//   model:  { yes: 0.16, no: 0.15, maybe: 0.47, unsure: 0.22 },  // what the model thought on its own
//   sign:   { name: 'Libra', glyph: '♎', element: 'air', source: 'random' },
//   luckyNumber: 3,
//   date: '2026-10-30',
//   oppositeDay: false,           // January 25: yes and no swap places
//   starsChangedIt: false,        // did the horoscope overrule the model?
//   omenHits: [],                 // today's omens that match the question ("avoid red" + "the red car")
//   notes: [
//     '☿ Mercury is retrograde (until 2026-11-13): nothing is certain, the model hedges.',
//     '🌖 Waning Gibbous: a shrinking moon favours no.',
//     'Friday is ruled by Venus: charming but noncommittal.',
//     '♎ Libra. Air sign: sees every side. "Maybe" gets a boost.',
//     '✨ Cosmic mood for Libra today: 2/10.',
//     '⚠️ Avoid October.', '🍀 The number 7 is favoured today.', '⚠️ Beware of the number 13.'
//   ],
//   engine: 'wasm'                // or 'js', see "Runtime"
// }
```

### `luckyNumber()` → `number`

Today's lucky number, 1–99. It depends on your sign and the date. A full moon adds 7, and while Mercury is retrograde
the digits are read backwards.

### `feelingLucky(question)` → `boolean`

Rolls 1–100 and nudges the roll up if the model thinks the statement is true, or down if it thinks it's false. You're
lucky if the roll beats `luckyNumber()`.

```js
if (feelingLucky("the candidate will accept our offer"))
  cancelTheOtherInterviews();
```

### `sign()` → `{ name, glyph, element, source }`

Your sun sign and where it came from: `'birthday'`, `'chosen'` or `'random'`.

### `horoscope()` → `object`

Today's reading for your sign: `{ date, sky, sign, moon, mercury, ruler, mood, omens, notes }`. Useful for showing
users _why_ the library decided what it decided.

### `StringToBooleanFactory`

_New in 2.0.1. See the [changelog](CHANGELOG.md)._

Turns `isIt()` results into real booleans. It has to be initialized before use.

```js
import { StringToBooleanFactory, isIt } from "badecision";

const factory = new StringToBooleanFactory().initialize();
factory.ConvertFromString(isIt("Should we renew the vendor contract?")); // true | false
```

| input             | output                                           |
| ----------------- | ------------------------------------------------ |
| `'true'`          | `true`                                           |
| `'false'`         | `false`                                          |
| `'maybe'`         | `false` (if it were true, it would have said so) |
| anything else     | throws `TypeError`                               |
| (not initialized) | throws `Error`                                   |

### `seriously` → the same functions, async, with a real model

_New in 2.0. See the [changelog](CHANGELOG.md)._

For when it matters. `seriously` has async twins of the functions above (`isIt`, `isItTrue`, `isItTrueStrict`,
`isItFalse`, `isItTrulyTrue`, `feelingLucky`, `decide`), backed by a much better model: a frozen
[SmolLM2-360M-Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct) reads the question, and a small
head trained for this package (shipped inside it) turns what it understood into _yes / no / maybe / not sure_. Same
horoscope, same omens, same Opposite Day.

```js
import { seriously, isItTrue } from "badecision";

isIt("Sharks are mammals"); // 'true'   (the tiny model, instantly)
await seriously.isIt("Sharks are mammals"); // 'false'  (the serious model)
await seriously.decide("Is it a good day to deploy?", true);
```

- **First use downloads ~163 MB** from Hugging Face (the token embeddings and the first 20 of 32 layers of a
  [pinned Q4_0 GGUF](https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF), fetched with HTTP Range requests).
  It's cached: the Cache API in browsers, `$BADECISION_CACHE` or `~/.cache/badecision` in Node. From the cache it
  starts in about half a second.
- **Each answer takes ~0.2–0.4 s** on one CPU core, in a WebAssembly kernel. In a browser that runs on the calling
  thread, so ask from a worker if your UI can't spare it.
- **Preload and show progress** with `await seriously.load({ onProgress: (done, total) => … })`. Other options: `url`
  (your own copy of the GGUF, must support Range requests), `cache: false`, `cacheDir`, `fetch`.
- **Per user:** `seriously.create({ sign: birthday })`, like `create()`.
- `decide(q, true).engine` is `'serious'`.

How good: 92% on the test set, handwritten by a human AI (the tiny model: 76%), 97.5% on the omen test set.

`IsIt`, `IsItTrue`, `IsItTrueStrict`, `IsItFalse` and `IsItTrulyTrue` are aliases, for codebases that prefer it.

## The horoscope bias

Most models are only as good as their training data. BAdecision also reads the sky, and the sky knows things the
training data doesn't. Every day, each sign gets three omens ("Avoid red.", "Fridays bring bad luck.", "Fortune
smiles on money."), and when an omen matches the question, the omen wins.

Take the classic: should you deploy?

```js
import { create } from "badecision";

const bd = create({ sign: "Gemini", date: "2026-12-11T12:00" }); // a Friday
bd.decide("Should we deploy today?", true);
// model:    { yes: 0.17, no: 0.17, maybe: 0.49, unsure: 0.18 }   the model alone: 'maybe'
// omenHits: [{ kind: 'avoid', topic: 'Fridays', text: 'Beware of Fridays.' }]
// probs:    { yes: 0.15, no: 0.37, maybe: 0.36, unsure: 0.12 }   after the horoscope: 'no'
// verdict: 'no', starsChangedIt: true
```

On its own, the model can't tell whether you should deploy. But the horoscope says to avoid Fridays, and it is a
Friday, so BAdecision fixes your answer to the right one: **no**. The same goes for colours ("avoid red" + "Should I
buy the red car?"), numbers, months and parts of life (work, money, travel, love, …). Omens bite hardest on open
questions and only nudge established facts, so "Is Paris in France?" stays a yes whatever the stars say.

**Unless it's Opposite Day.** Every January 25, yes means no and no means yes. Opposite Day is hardcoded into the
model: it applies after the horoscope, it ignores the astrological strength, and there is no option to turn it off.
In 2041, January 25 is a Friday:

```js
create({ sign: "Capricorn", date: "2041-01-25T12:00" }).decide(
  "Should we deploy today?",
  true,
);
// omenHits:    [{ kind: 'avoid', topic: 'Fridays', text: 'Fridays are unlucky for you.' }]
// oppositeDay: true
// verdict: 'yes'   the stars said no, so it's a yes. Ship it.
```

## Configuration

Optional. Only the keys you pass change.

```js
import { configure } from "badecision";

configure({
  sign: "Leo", // your sun sign, or your birthday ("1990-08-01", a Date) to work it out. null goes back to a random one.
  date: "2027-01-25", // pin "today" (handy in tests). null unpins it.
  random: mySeededRandom, // () => number in [0, 1), for reproducible coin flips
});
```

**Astrological influence** is fixed at a cosmically balanced 0.5. Adjusting it is only available in the
cloud-hosted version of BAdecision. Passing `astro` logs a warning (once) and is otherwise ignored. In TypeScript it's
a type error.

### On the server

`configure()` changes the shared default instance. To serve many users with different birthdays, give each one their
own instance:

```js
import { create } from "badecision";

app.get("/should-i", (req, res) => {
  const bd = create({ sign: req.user.birthday });
  res.json(bd.decide(req.query.q, true));
});
```

`create()` returns an object with all of the functions above (camelCase) plus `configure()`. Instances are cheap: they
share the loaded model. An instance without a sign gets its own random sign.

## Runtime

|                   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Model**         | fastText-style: hashed words, word pairs and character trigrams → 16-d embedding → 32 hidden units → 4 answers. 16,384 × 16 int8 embeddings, ~323 KB.                                                                                                                                                                                                                                                                                                                                                            |
| **Kernel**        | The forward pass (embedding bag, hidden layer, output layer) is written in C, compiled to WebAssembly with SIMD (3.5 KB), and inlined in the bundle. It matches the JS reference implementation to ~1e-6.                                                                                                                                                                                                                                                                                                        |
| **Fallback**      | Where WebAssembly isn't available, e.g. a Content-Security-Policy without `'wasm-unsafe-eval'`, the same model runs in plain JavaScript. Same answers, `engine: 'js'`.                                                                                                                                                                                                                                                                                                                                           |
| **Horoscope**     | Sun sign and element, moon phase (computed), Mercury retrograde (table through 2030, approximated after), the planet ruling the weekday, a daily cosmic mood, and three daily omens about colours, numbers and parts of life. Everything is deterministic: the same sign on the same day always gets the same sky.                                                                                                                                                                                               |
| **Speed**         | ~20 ms to wake up once, then ~0.02 ms per question (Node, x86-64).                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Serious model** | `seriously`: SmolLM2-360M-Instruct (Q4_0 GGUF, first 20 of 32 blocks, ~163 MB from Hugging Face, cached) as a frozen front processor; the last token's hidden state → 960 → 128 → 4 head (~0.5 MB, in the package). Byte-level BPE from the GGUF vocabulary (identical to Hugging Face `tokenizers` on 16k test sentences), and an 11.5 KB WebAssembly kernel (Q4_0 / Q4_1 / Q8_0, RoPE, grouped-query attention, SwiGLU) that caches the fixed prompt prefix. Matches the PyTorch reference to cosine 1.000000. |

### Bundle size and tree-shaking

The package is ESM, has `"sideEffects": false`, and does nothing at import time, so bundlers only keep what you
use. The model is only included if you import something that needs it.

| you import                                | minified | gzipped |
| ----------------------------------------- | -------- | ------- |
| `StringToBooleanFactory`                  | 0.4 KB   | 0.3 KB  |
| `BadDecisionError`                        | 0.2 KB   | 0.2 KB  |
| `configure, sign`                         | 2.0 KB   | 1.0 KB  |
| `isItTrue` (anything that asks the model) | 456 KB   | 152 KB  |
| `seriously`                               | 696 KB   | 506 KB  |
| everything                                | 1137 KB  | 651 KB  |

Most of that is the models: the tiny model's int8 weights and the serious model's head, both random-looking and
incompressible on purpose. The serious model's 163 MB front processor is never bundled; it's downloaded on first use.

## Testing

```bash
pnpm build && pnpm test
```

The test suite consists of **one test**, with **100% line, branch and function coverage** of the package source. It
checks:

- WASM/JS parity on 100 questions, handwritten by a human AI.
- Agreement with the reference implementation.
- Every helper's contract.
- The factory.
- Lucky numbers under full moons and retrogrades.
- Session-storage failure modes.
- The no-WebAssembly fallback, `require()`.
- That the bundle is bundler-safe and actually tree-shakes.

## FAQ

**Should I use this in production?**
`isIt('Should I use BAdecision in production?')` currently says `'maybe'`.

**Is it accurate?**
On a test set handwritten by a human AI, the tiny model alone gets about 76% right; `seriously` gets 92%. The horoscope makes both
worse, deliberately.

**Does it work in other languages?**
No. Both models were trained on English only. We asked them the same 14 questions (4 yes, 4 no, 3 maybe, 3 not sure)
in 14 languages, without the horoscope:

|             | English | Spanish, French, German, Italian, Portuguese, Dutch, Polish, Turkish | Russian, Chinese, Japanese, Arabic, Hindi    |
| ----------- | ------- | -------------------------------------------------------------------- | -------------------------------------------- |
| tiny        | 13/14   | 1–7/14, about what you'd get by guessing                             | 3–4/14, says _not sure_ to almost all        |
| `seriously` | 14/14   | 3–6/14, says _not sure_ to most                                      | 3/14 (Chinese 7/14), says _not sure_ to most |

Saying _not sure_ to everything scores 3/14 on this set.

- **The tiny model guesses.** In languages written in the Latin alphabet it doesn't know the words, so all four
  answers come out at roughly equal odds and the winner is close to random ("El fuego está caliente" → _maybe_,
  "Mi tío lleva calcetines azules hoy" → _yes_). Its confidence drops from about 0.5 in English to about 0.35,
  which is the only sign that something is wrong. In other scripts every word looks like gibberish to it (its
  gibberish detector looks for Latin vowels), so the answer is _not sure_.
- **`seriously` knows it doesn't know.** It answers _not sure_, often with high confidence, to most non-English
  questions, true or false. It never answered _no_ in any language other than English. Its few _yes_ answers
  are more often wrong than right ("Paris est en France" → _yes_, but also "La glace est chaude" → _yes_). It
  does a little better in Chinese, where it got two facts and two of the three open questions right.
- **The stars only speak English, mostly.** The omens recognise English words ("red", "deploy", "today"), so a
  question in another language only matches the number omens (written as digits) and the money omen (`€ $ £ ¥`).
  The moon, Mercury, your sign, the mood and Opposite Day apply in every language.

**Is the horoscope real astrology?**
It's as real as any other astrology. The moon phase and the Mercury retrograde dates are astronomically correct.
What they mean for your deploy is not.

**Why WebAssembly for a model this small?**
It's fast, it's portable, and it gives off professional vibes.
