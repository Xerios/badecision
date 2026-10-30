# Balanced Assessment Decisions (Bad Decision Model)

A tiny yes / no / maybe / unsure text classifier, made deliberately unreliable by a horoscope layer. It ships as:
- the root research project: training, eval and the Unsloth Studio distillation. See `PLAN.md` for the runbook.
- the npm package `badecision` in `packages/badecision/`.

## Ground rules
- **pnpm only** (`packageManager` is pinned). The root package has **zero dependencies**. Keep it that way. Dev
  dependencies (typescript, esbuild) belong to `packages/badecision/` only.
- Node ≥ 20 for the published code. The dev tooling uses Node 26 features (native TypeScript stripping for `.ts`
  scripts and tests).
- `src/features.js` defines the model's input space. Any change there means retraining (`pnpm run train`) and
  re-checking `pnpm run eval`.
- **Never train on `data/test.jsonl` or `data/omen-test.jsonl`.** They are the held-out sets.
- Never commit `.env` (Studio URL + key). Never `npm publish` without the user asking.

## Layout
- `src/`: the shared core, plain JS ESM, runs in browsers and Node.
  - `features.js`: tokenizer and hashing.
  - `model.js`: `TinyModel` runtime and the BDM1 format.
  - `load.js`: `loadModel` via fs or fetch. Kept apart so bundles never see `node:fs`.
  - `horoscope.js`: sky, signs, moon, Mercury.
  - `omens.js`: "avoid red"-style omens.
  - `decider.js`: sync `makeDecider(model)` and `finish()`, shared by all backends.
  - `bdm.js`: the async `createDecider` / `createStudioDecider` entry point.
  - `decision.js`: the Studio Decision API client.
  - `gguf.js`, `bpe.js`, `smol.js`: the serious model. A frozen SmolLM2-360M-Instruct front processor (Q4_0 GGUF from
    Hugging Face, first 20 blocks only, via HTTP Range) + a trained head (`models/serious/head.json`). Must match
    `scripts/py/smol_ref.py`, the PyTorch reference the head was trained with.
- `scripts/`: training, eval, CLI, demo server, Unsloth tooling. `scripts/selftest.js` is the root test suite.
- `models/tiny/model.bin`: the shipped tiny model. `models/serious/head.json`: the serious model's head.
  `models/exp-*` are experiments.
- `scripts/py/`: Python (uv venv in `.venv/`, CPU torch): `probe_frontends.py` / `probe_layers.py` (pick a front
  processor), `smol_ref.py` (reference forward + training features), `train_head.py` (the head).
- `web/index.html`: the demo page, which imports `../src/bdm.js` directly.
- `packages/badecision/`: the npm package, in TypeScript.
  - `src/*.ts`: the package's own code, written by hand.
  - `src/core/` and `src/generated/`: build outputs (gitignored). The build copies the core files from the root
    `src/` into `src/core/`, so edit the root files, never `src/core/`.
  - `kernel/bdm_kernel.c`: the forward pass, compiled to `bdm_kernel.wasm`. The `.wasm` is committed and must stay
    under 4 KB so it can compile synchronously.
  - `kernel/smol_kernel.c`: the serious model's transformer blocks, `smol_kernel.wasm` (committed, compiled async, so
    no size limit).
  - `src/serious.ts`: `seriously`, the async API over the serious model.
  - `test/badecision.test.ts`: the package's only test, by design. Extend that single test; don't add new ones. It
    keeps 100% line/branch/function coverage of `dist/` (excluding `core/` and `generated/`).

## Commands
```bash
pnpm test                 # root selftests (offline)
pnpm run eval             # tiny model on data/test.jsonl
pnpm run train            # retrain models/tiny
pnpm run demo             # http://localhost:5173/web/  (also serves packages/badecision/test/browser.html)
pnpm run pkg:build        # build packages/badecision/dist
pnpm run pkg:kernel       # rebuild the WASM kernel too (needs clang with wasm32 + wasm-ld)
pnpm run pkg:test         # the one test, with coverage
```

## Package invariants (packages/badecision)
- Everything is synchronous and nothing runs at import time (`sideEffects: false`, named exports only). Heavy data
  (model base64) is imported only by `engine.ts`, so e.g. `StringToBooleanFactory` alone tree-shakes to < 1 KB.
  The one exception is `seriously` (user's choice): async twins of the API over the serious model, downloaded on
  first use. Its kernel and head are imported only by `serious.ts` and must stay out of other bundles (tested).
- `dist/` must not contain `node:` imports or `import.meta.url`. The build and the test both check this.
- The WASM kernel and the JS `TinyModel.logits` must agree (tested to 1e-4).
- The joke API is the spec. Don't "fix" it:
  - `isIt` returns the *strings* `'true' | 'false' | 'maybe'`. `isItTrue` returns `'true' | false | null`: only a
    yes is truthy.
  - `StringToBooleanFactory` must be `.initialize()`d.
  - `isItTrulyTrue` always returns `false`.
  - astro strength is fixed at 0.5 ("only in the cloud-hosted version").
  - `decide(q)` is small; `decide(q, true)` is nerdy.

## Sandbox notes (Claude Code)
- The pnpm store (`~/.local/share/pnpm`) is not writable in the sandbox. Install with
  `pnpm install --store-dir "$TMPDIR/pnpm-store"`. After that, `pnpm run`/`pnpm test` in the package can fail on the
  deps check. Run the underlying `node ...` commands from `package.json` directly instead.
- Unsloth Studio scripts need the proxy workaround described in PLAN.md (`NODE_USE_ENV_PROXY=1`, empty `NO_PROXY`).
- Another Claude session may be editing this repo at the same time. Re-read files right before editing them, and
  prefer targeted edits to rewriting whole shared files.
