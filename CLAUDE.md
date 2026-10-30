# Balanced Assessment Decisions (Bad Decision Model)

A tiny yes / no / maybe / unsure text classifier, made deliberately unreliable by a horoscope layer. A pnpm workspace;
the root package is private and holds no code:
- `packages/core/` (`@badecision/core`, private): the shared JS and the shipped models.
- `packages/badecision/`: the npm package `badecision`.
- `research/` (`@badecision/research`, private): training, eval and the Unsloth Studio distillation. See `PLAN.md`
  for the runbook.
- `packages/website/` (`@badecision/website`, private): the demo, Preact + Vite.

## Ground rules
- **pnpm only** (`packageManager` is pinned). The root, `packages/core` and `research` have **zero dependencies**.
  Keep it that way. Dev dependencies (typescript, esbuild) belong to `packages/badecision/`; preact and vite belong to
  `packages/website/`. Research scripts
  import the core by relative path (`../../packages/core/src/...`), not through a workspace link.
- Node ≥ 20 for the published code. The dev tooling uses Node 26 features (native TypeScript stripping for `.ts`
  scripts and tests).
- `packages/core/src/features.js` defines the model's input space. Any change there means retraining (`pnpm run train`) and
  re-checking `pnpm run eval`.
- **Never train on `research/data/test.jsonl` or `research/data/omen-test.jsonl`.** They are the held-out sets.
- Never commit `.env` (Studio URL + key, at the repo root). Never `npm publish` without the user asking.

## Layout
- `packages/core/src/`: the shared core, plain JS ESM, runs in browsers and Node.
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
    `research/py/smol_ref.py`, the PyTorch reference the head was trained with.
- `packages/core/models/`: `tiny/model.bin` (the shipped tiny model, written by `research/scripts/train-tiny.js`) and
  `serious/head.json` (the serious model's head, written by `research/py/train_head.py`).
- `packages/core/test/selftest.js`: the core's offline checks.
- `research/`: **all its scripts run with `research/` as the working directory** (paths like `data/test.jsonl` are
  relative to it; `scripts/lib/unsloth.js` exports `ROOT` = research/, `REPO`, `CORE`).
  - `scripts/`: training, eval, CLI, Unsloth tooling, the mock Studio. `scripts/selftest.js` checks the Unsloth
    pipeline against the mock.
  - `data/`: datasets (seed, teacher-labelled, decision, held-out test sets).
  - `py/`: Python (uv venv in `research/.venv/`, CPU torch, `HF_HOME=.cache/hf`): `probe_frontends.py` /
    `probe_layers.py` (pick a front processor), `smol_ref.py` (reference forward + training features),
    `train_head.py` (the head).
  - `studio/`: Studio probe reports, run records, `train_answer_head.py`.
  - `models/exp-*`: experiments. `.cache/` (gitignored): HF cache, the local GGUF, features.
- `packages/website/`: the demo. `index.html` + `src/main.jsx` (Preact) + `src/style.css`, served by Vite. Imports
  `@badecision/core` (workspace link, served unbundled, so the core's `new URL('../models/...', import.meta.url)`
  still resolves).
- `packages/badecision/`: the npm package, in TypeScript.
  - `src/*.ts`: the package's own code, written by hand.
  - `src/core/` and `src/generated/`: build outputs (gitignored). The build copies the core files from
    `packages/core/src/` into `src/core/`, so edit those, never `src/core/`.
  - `kernel/bdm_kernel.c`: the forward pass, compiled to `bdm_kernel.wasm`. The `.wasm` is committed and must stay
    under 4 KB so it can compile synchronously.
  - `kernel/smol_kernel.c`: the serious model's transformer blocks, `smol_kernel.wasm` (committed, compiled async, so
    no size limit).
  - `src/serious.ts`: `seriously`, the async API over the serious model.
  - `test/badecision.test.ts`: the package's only test, by design. Extend that single test; don't add new ones. It
    keeps 100% line/branch/function coverage of `dist/` (excluding `core/` and `generated/`). It reads
    `research/data/test.jsonl` and, if present, `research/.cache/gguf/SmolLM2-360M-Instruct-Q4_0.gguf`.

## Commands
```bash
pnpm test                 # core + research selftests (offline)
pnpm run eval             # tiny model on research/data/test.jsonl
pnpm run train            # retrain packages/core/models/tiny
pnpm run eval:serious     # serious model on both test sets (needs research/.cache/gguf)
pnpm dev                  # the website (Vite) at http://localhost:5173/
pnpm run build:website    # packages/website/dist
pnpm run pkg:build        # build packages/badecision/dist
pnpm run pkg:kernel       # rebuild the WASM kernel too (needs clang with wasm32 + wasm-ld)
pnpm run pkg:test         # the one test, with coverage
pnpm run pkg:browser      # static server for packages/badecision/test/browser.html (http://localhost:5174/)
```
Root research scripts delegate with `pnpm --filter @badecision/research <script>`; the same names work inside `research/`.

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
  deps check. Run the underlying `node ...` commands from `package.json` directly instead (`node
  packages/core/test/selftest.js`; `cd research && node scripts/...`).
- Unsloth Studio scripts need the proxy workaround described in PLAN.md (`NODE_USE_ENV_PROXY=1`, empty `NO_PROXY`).
- Another Claude session may be editing this repo at the same time. Re-read files right before editing them, and
  prefer targeted edits to rewriting whole shared files.
