# Balanced Assessment Decisions (BAdecision)

A tiny yes / no / maybe / unsure text classifier, made deliberately unreliable by a horoscope layer. A pnpm workspace;
the root package is private and holds no code:
- `packages/core/` (`@badecision/core`, private): the shared JS and the shipped models.
- `packages/badecision/`: the npm package `badecision`.
- `packages/model/` (`@badecision/model`, private): training, eval and the Unsloth Studio distillation. See `PLAN.md`
  for the runbook.
- `packages/website/` (`@badecision/website`, private): the demo, Preact + Vite.

## Ground rules
- **pnpm only** (`packageManager` is pinned). The root, `packages/core` and `packages/model` have **zero dependencies**.
  Keep it that way. Dev dependencies (typescript, vite, esbuild for the test) belong to `packages/badecision/`;
  preact and vite to `packages/website/`. Both import `@badecision/core` through a workspace link. Model scripts
  import the core by relative path (`../../core/src/...`), not through a workspace link.
- Node ≥ 20 for the published code. The dev tooling uses Node 26 features (native TypeScript stripping for `.ts`
  scripts and tests).
- `packages/core/src/features.js` defines the model's input space. Any change there means retraining (`pnpm run train`) and
  re-checking `pnpm run eval`.
- **Never train on `packages/model/data/test.jsonl` or `packages/model/data/omen-test.jsonl`.** They are the held-out sets.
- Never commit `.env` (Studio URL + key, at the repo root). Never `npm publish` without the user asking.

## Layout
- `packages/core/src/`: the shared core, plain JS ESM, runs in browsers and Node. The npm package's build
  ships the files it imports, so no `node:` imports or `import.meta.url` outside `load.js` (see `packages/badecision/CLAUDE.md`).
  - `load.js`: `loadModel` via fs or fetch. Kept apart so bundles never see `node:fs`.
  - `gguf.js`, `bpe.js`, `smol.js`: the serious model. A frozen SmolLM2-360M-Instruct front processor (Q4_0 GGUF from
    Hugging Face, first 20 blocks only, via HTTP Range) + a trained head (`models/serious/head.json`). Must match
    `packages/model/py/smol_ref.py`, the PyTorch reference the head was trained with.
- `packages/core/models/`: `tiny/model.bin` (the shipped tiny model, written by `packages/model/scripts/train-tiny.js`) and
  `serious/head.json` (the serious model's head, written by `packages/model/py/train_head.py`).
- `packages/website/`: the demo. `index.html` + `src/main.jsx` (Preact) + `src/style.css`, served by Vite. Imports
  `@badecision/core` (workspace link, served unbundled, so the core's `new URL('../models/...', import.meta.url)`
  still resolves).

## Commands
```bash
pnpm test                 # core + model selftests (offline)
pnpm run eval             # tiny model on packages/model/data/test.jsonl
pnpm run train            # retrain packages/core/models/tiny
pnpm run eval:serious     # serious model on both test sets (needs packages/model/.cache/gguf)
pnpm dev                  # the website (Vite) at http://localhost:5173/
pnpm run build:website    # packages/website/dist
pnpm run pkg:build        # build packages/badecision/dist
pnpm run pkg:kernel       # rebuild the WASM kernel too (needs clang with wasm32 + wasm-ld)
pnpm run pkg:test         # the one test, with coverage
pnpm run pkg:browser      # static server for packages/badecision/test/browser.html (http://localhost:5174/)
```
Root model scripts delegate with `pnpm --filter @badecision/model <script>`; the same names work inside `packages/model/`.

## Sandbox notes (Claude Code)
- The pnpm store (`~/.local/share/pnpm`) is not writable in the sandbox. Install with
  `pnpm install --store-dir "$TMPDIR/pnpm-store"`. After that, `pnpm run`/`pnpm test` in the package can fail on the
  deps check. Run the underlying `node ...` commands from `package.json` directly instead (`node
  packages/core/test/selftest.js`; `cd packages/model && node scripts/...`).
- Unsloth Studio scripts need the proxy workaround described in PLAN.md (`NODE_USE_ENV_PROXY=1`, empty `NO_PROXY`).
- Another Claude session may be editing this repo at the same time. Re-read files right before editing them, and
  prefer targeted edits to rewriting whole shared files.
