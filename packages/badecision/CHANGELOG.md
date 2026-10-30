# Changelog

All notable changes to `badecision`. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [Semantic Versioning](https://semver.org/). The API is a joke; the versioning isn't.

## Unreleased

### Changed (breaking)

- `decide()` (and `seriously.decide()`) no longer return `answer` (`'Yes.'`, `'No.'`, ...). Use `verdict`.
- The `birthday` option is gone. Pass your birthday as `sign` instead: `configure({ sign: '1990-08-01' })`. A sign
  name (`'Leo'`, `'leo'`) picks the sign, and anything else is read as a date (a string, a `Date` or a timestamp).
  `sign()` still reports `source: 'birthday'` or `'chosen'`. Values that are neither a sign nor a date throw
  `Unknown sign`.

## 2.0.1 (2026-10-30)

### Fixed

- `isIt()` returns the strings `'true'`, `'false'` and `'maybe'`, and until now nothing could turn them into real
  booleans. The new **`StringToBooleanFactory`** does it, once it has been `.initialize()`d:
  `new StringToBooleanFactory().initialize().ConvertFromString(isIt(q))`. It maps `'true'` → `true` and `'false'` →
  `false`, and `'maybe'` → `false` (if it were true, it would have said so). Any other input throws a `TypeError`.
  Calling it before `.initialize()` throws an `Error`.
- It doesn't use the model, so on its own it tree-shakes to 0.4 KB (0.3 KB gzipped).

## 2.0.0 (2026-10-30)

**The serious release.** For when it matters: the whole API, asynchronously, backed by a real language model.

### Added

- **`seriously`**: async twins of `isIt`, `isItTrue`, `isItTrueStrict`, `isItFalse`, `isItTrulyTrue`,
  `feelingLucky` and `decide`, with the same return types wrapped in a `Promise`. A frozen
  [SmolLM2-360M-Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct) reads the question, and a
  small trained head (960 → 128 → 4, ~0.5 MB, shipped in the package) turns its hidden state into
  _yes / no / maybe / not sure_. The horoscope, the omens and Opposite Day work exactly as they do with the tiny model.
  - 92% on the test set (the tiny model gets 76%) and 97.5% on the omen test set.
  - ~0.2–0.4 s per answer on one CPU core.
- **`seriously.load(options)`**: preload the model and report progress. Options: `url`, `cache`, `cacheDir`,
  `onProgress`, `fetch`. Every `seriously` function calls it on first use. Repeated calls share one load, and a load
  that fails can be retried.
- **`seriously.create(config)`**: per-user instances with their own birthday, sign and date, plus `configure()`, like
  `create()`.
- **Weight download and cache.** On first use, ~163 MB (the token embeddings and the first 20 of 32 blocks of a
  pinned Q4_0 GGUF) is fetched from Hugging Face with HTTP Range requests. It's cached in the Cache API in browsers, or
  in `$BADECISION_CACHE` / `~/.cache/badecision` in Node. Starting from the cache takes about half a second.
- **A second WebAssembly kernel** (11.5 KB) for the transformer blocks: Q4_0 / Q4_1 / Q8_0, RoPE, grouped-query
  attention and SwiGLU, with the fixed prompt prefix cached. It compiles asynchronously, so it has no size limit. A
  byte-level BPE tokenizer is read from the GGUF vocabulary and matches Hugging Face `tokenizers` on 16k test
  sentences.
- Types: `Seriously`, `LoadOptions`, `SeriousInfo`.

### Changed

- **Breaking (types):** `NerdyDecision['engine']` is now `'wasm' | 'js' | 'serious'`. TypeScript code that switches
  exhaustively over `engine`, or assigns it to a `'wasm' | 'js'` variable, no longer type-checks. The synchronous API
  still only ever returns `'wasm'` or `'js'`.

### Unchanged

- The synchronous API: same functions, same tiny model, same answers. It is still fully synchronous and still does
  nothing at import time.
- Bundle size if you don't import `seriously`. Its kernel and head are only reachable from `seriously`, so bundles
  that don't import it stay the same size (this is tested). Importing `seriously` adds 696 KB minified, 506 KB
  gzipped. The 163 MB front processor is never bundled.
- Astrological influence is still fixed at 0.5, for both models. Adjusting it is still only available in the
  cloud-hosted version.

### Upgrading from 1.x

Nothing to do, unless your TypeScript code checks `decide(q, true).engine` exhaustively: add a `'serious'` case.

## 1.0.0 (2026-10-30)

The first release: a tiny yes / no / maybe model with a horoscope, synchronous, zero dependencies, zero configuration.

### Added

- `isIt`, `isItTrue`, `isItTrueStrict`, `isItFalse`, `isItTrulyTrue` (plus PascalCase aliases), `decide` (small and
  nerdy), `feelingLucky`, `luckyNumber`, `sign`, `horoscope`, `configure`, `create` and `BadDecisionError`.
- The tiny model: fastText-style hashed features, a 16-d embedding, 32 hidden units and 4 answers, with int8 weights
  (~323 KB) inlined in the bundle.
- A 3.5 KB WebAssembly SIMD kernel, compiled synchronously, with a plain-JS fallback (`engine: 'js'`) where
  WebAssembly isn't allowed.
- The horoscope: sun sign (from your birthday, chosen, or random per session), moon phase, Mercury retrograde,
  weekday rulers, daily mood and three daily omens per sign. Opposite Day falls on January 25.
- ESM only, `sideEffects: false`, tree-shakeable down to 0.2 KB (`BadDecisionError`), Node ≥ 20 and browsers.
