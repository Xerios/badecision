# packages/badecision (the npm package `badecision`)

## Layout
- `src/*.ts`: the package's own code, written by hand.
- `src/core/` and `src/generated/`: build outputs (gitignored). The build copies the core files from
  `packages/core/src/` into `src/core/`, so edit those, never `src/core/`.
- `kernel/bdm_kernel.c`: the forward pass, compiled to `bdm_kernel.wasm`. The `.wasm` is committed and must stay
  under 4 KB so it can compile synchronously.
- `kernel/smol_kernel.c`: the serious model's transformer blocks, `smol_kernel.wasm` (committed, compiled async, so
  no size limit).
- `test/badecision.test.ts`: the package's only test, by design. Extend that single test; don't add new ones. It
  keeps 100% line/branch/function coverage of `dist/` (excluding `core/` and `generated/`). It reads
  `research/data/test.jsonl` and, if present, `research/.cache/gguf/SmolLM2-360M-Instruct-Q4_0.gguf`.

## Package invariants
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
