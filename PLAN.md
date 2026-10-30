# Bad Decision Model: plan & runbook

> **For a fresh Claude session:** read this file top to bottom, then run _Phase 0_. Everything marked ✅ is built and
> tested; everything marked 🔲 is the work left. The Unsloth parts were written **without access to the server**
> (network was blocked when this was built), so treat them as "should work, verify first". A mock server
> (`npm run unsloth:mock`) emulates the API and the whole pipeline passes against it (`npm test`).

## Goal

A model that takes a sentence and returns probabilities for **yes / no / maybe / unsure**:

| label  | meaning                                                                             | example                       |
| ------ | ----------------------------------------------------------------------------------- | ----------------------------- |
| yes    | true / the answer is yes                                                            | "Fire is hot"                 |
| no     | false / the answer is no                                                            | "Penguins can fly"            |
| maybe  | plausible but uncertain: predictions, chance, opinions, decisions, contested        | "It will rain tomorrow"       |
| unsure | nobody could know: private info, unknowable numbers, far-future specifics, nonsense | "My neighbour owns 14 spoons" |

Constraints: **as small as possible**, runs **on CPU and in the browser**, plus an optional **horoscope** that nudges
the outcome. Accuracy is explicitly not important; being fun and "aware of what it doesn't know" is.

## Architecture (decided)

```
            ┌────────────── training (one-off) ──────────────┐
seed data ─►│ templates + hand-written facts  (no GPU)        │
            │ Studio LLM generates + scores sentences (3060)  │──► soft labels ──► tiny model (JS, CPU, seconds)
            │ optional: fine-tune small LLM in Studio (3060)  │
            └─────────────────────────────────────────────────┘
runtime:   text ──► tiny model (323 KB int8, pure JS, ~1 ms) ──► probs ──► horoscope layer ──► verdict
```

- **Tiny model**: fastText-style hashed word unigrams + bigrams + char trigrams, mean-pooled 16-d embeddings,
  32-unit leaky-ReLU layer, 4-way softmax, temperature-calibrated. Weights int8 (per-row scale) in a single
  `models/tiny/model.bin` (BDM1 format, documented in `src/model.js`). Zero dependencies; the same code runs in Node and browsers.
  Trained in plain JS (`scripts/train-tiny.js`), so the whole user-facing stack is JavaScript.
- **Where the knowledge comes from**: the tiny model can't know facts it hasn't seen (tested: unseen yes/no facts
  are close to a coin flip). It _can_ learn the _shape_ of uncertainty (maybe/unsure ≈ 85–100%). Knowledge is
  injected by **distillation**: a bigger LLM on the 3060 writes and scores thousands of sentences, and the tiny model
  trains on the LLM's soft probabilities.
- **Horoscope** (`src/horoscope.js`) is a post-processing layer, not part of the model: sun sign & element from an
  optional birthday, computed moon phase, Mercury retrograde table 2025–2030 (Farmers' Almanac; approximated after),
  weekday planetary ruler, and a deterministic daily "cosmic mood". Applied in logit space with a 0–1.5 strength.
  Keeping it separate means `astro: 0` gives the pure model.
- **Optional LLM tier**: a fine-tuned SmolLM2-135M / Qwen3-0.6B answering with one token. Exported as GGUF from
  Studio, it can run in the browser via wllama (llama.cpp WASM), ~100–150 MB. It's the "smarter but heavy" option and a better teacher.

## Environment facts (as found on 2026-10-30)

- `.env` (git-ignored) has `UNSLOTH_BASEURL = http://<studio-ip>:8888` and `UNSLOTH_API_KEY = sk-unsloth-…`.
  The PC behind it has an **RTX 3060 12 GB** and runs **Unsloth Studio**. `scripts/lib/unsloth.js` parses the
  `KEY = value` format (spaces OK).
- From the Claude session the URL returned `403 Connection blocked by network allowlist`, even after the user
  added it. Likely the allowlist entry must be the **bare host** (`<studio-ip>`, no scheme/port) and/or the session
  must be **new** for the rules to apply. If it's still blocked, the user can run the `npm run unsloth:*` commands on any machine on their LAN.
- Unsloth docs (unsloth.ai/docs/basics/api) say the API is **inference-only** (OpenAI-compatible `/v1/chat/completions`,
  `/v1/completions`, `/v1/models`, …). **Training, dataset upload and export are done in the Studio web UI** (which can
  import a YAML config). `/openapi.json` "includes internal routes", so the probe dumps it to look for undocumented
  training endpoints. **"Installing" models**: also a UI action (model dropdown) or `unsloth run --model …` on that PC.

## Status

|     | Item                                                                                            | Where                                                                                            |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| ✅  | Feature extraction (hashing, negation-aware)                                                    | `src/features.js`                                                                                |
| ✅  | Tiny model runtime, BDM1 format, Node + browser                                                 | `src/model.js`                                                                                   |
| ✅  | Public API `createDecider().decide(text, {astro, birthday, date})`                              | `src/bdm.js`                                                                                     |
| ✅  | Horoscope layer                                                                                 | `src/horoscope.js`                                                                               |
| ✅  | Seed dataset: 2,876 rows, soft labels                                                           | `scripts/build-seed-dataset.js` → `data/seed.*.jsonl`                                            |
| ✅  | Hand-written test set (100 rows, 25/label, never used for training)                             | `data/test.jsonl`                                                                                |
| ✅  | JS trainer with class balancing, int8 quantization, temperature calibration                     | `scripts/train-tiny.js`                                                                          |
| ✅  | Baseline model trained (323 KB, **76% test accuracy**)                                          | `models/tiny/model.bin`                                                                          |
| ✅  | CLI, browser demo, static server, eval, self-tests                                              | `scripts/cli.js`, `web/index.html`, `scripts/serve.js`, `scripts/eval.js`, `scripts/selftest.js` |
| ✅  | Unsloth client, probe, generator, labeller (logprobs → json → sampling fallbacks)               | `scripts/lib/*.js`, `scripts/probe-unsloth.js`, `scripts/teacher-*.js`                           |
| ✅  | Studio fine-tune dataset export (chat / ShareGPT / Alpaca)                                      | `scripts/export-studio-dataset.js`                                                               |
| ✅  | Mock Unsloth server + pipeline test                                                             | `scripts/mock-unsloth.js`, `npm test`                                                            |
| ⚠️  | Fallback Python trainer for the 3060 (soft-label answer-token LoRA + GGUF export). **Untested** | `studio/train_answer_head.py`                                                                    |
| 🔲  | Phase 0: reach the real Studio, record capabilities                                             | below                                                                                            |
| 🔲  | Phase 1: generate + label ~6k sentences with the Studio LLM                                     | below                                                                                            |
| 🔲  | Phase 2: distil into the tiny model, compare to baseline                                        | below                                                                                            |
| 🔲  | Phase 3: fine-tune a small LLM in Studio (optional), use as teacher and/or browser LLM tier     | below                                                                                            |
| 🔲  | Phase 4: polish (browser LLM tier page, npm package, publish demo)                              | below                                                                                            |

### Baseline numbers (seed data only, `npm run eval`)

```
accuracy 76.0%   (hand-written test set, n=100)
class    precision  recall
yes         62%      72%     <- needs knowledge (distillation)
no          61%      56%     <- needs knowledge
maybe       89%      96%
unsure      95%      80%
```

## Runbook

All commands from the project root, Node ≥ 20, no `npm install` needed (zero deps).

### Phase 0: connectivity & capabilities (5 min)

```bash
npm test                      # 9 offline checks incl. mock-API pipeline, must pass first
npm run unsloth:probe         # hits the real server from .env
```

The probe writes `studio/probe-report.json` and `studio/openapi.json` and prints:

- `models`: which model is loaded. **The labeller needs a capable model loaded** (good picks for 12 GB: Qwen3-8B
  Q4, Qwen3-4B, Llama-3.1-8B Q4, Gemma-3-4B). If only a tiny model is loaded, load a bigger one in the Studio UI
  first (that's the "install" step; the API can't do it).
- `chatLogprobs`: if ✔, the judge uses real token probabilities (best). If ✘, it falls back to asking for JSON
  probabilities (fine, noisier).
- `trainingRelatedRoutes`: **if any training/dataset/export routes show up**, read `studio/openapi.json`, then
  write `scripts/studio-train-api.js` that uploads `data/studio/train.chat.jsonl` and starts a run with the settings in
  Phase 3. If none show up, training goes through the UI (Phase 3, option A).

**Inside a Claude session (sandboxed shell) Node's `fetch` ignores the proxy** and connects directly, which fails
with `ENETUNREACH` / `fetch failed`, while `curl` goes through the proxy. Run the Unsloth scripts with the proxy
forced on (Node ≥ 22.21 supports this), and clear NO_PROXY because it lists 192.168.0.0/16:

```bash
export NO_PROXY= no_proxy= NODE_USE_ENV_PROXY=1     # only needed in the Claude sandbox, not on a normal LAN machine
curl -s -o /dev/null -w '%{http_code}\n' http://<studio-ip>:8888/v1/models   # 403 "blocked by network allowlist" = allowlist still not applied
```

Verified 2026-10-30: with these vars Node reaches npmjs.org through the proxy (200), but the Studio host was
still refused by the allowlist.

**Blocked (403 / allowlist / ECONNREFUSED)?** Check the allowlist entry is the bare host `<studio-ip>`, that Studio
is running and listening on the LAN (not just localhost), and that the key is valid (401 = bad key). Last resort:
run Phases 1–3 on a machine on the LAN; they're plain Node scripts.

### Phase 1: generate & label with the Studio LLM (~1 h on a 3060, rough guess)

```bash
npm run unsloth:generate -- --per-label 1500 --batch 25 --concurrency 4   # -> data/teacher.candidates.jsonl
npm run unsloth:label -- --alpha 0.7 --concurrency 4                       # -> data/teacher.jsonl
npm run unsloth:eval                                                       # how good is the teacher on the test set?
```

- Both scripts are **resumable** (re-run after a crash, they skip finished work) and dedupe.
- Quality check: `head -50 data/teacher.candidates.jsonl`; inspect disagreements with the one-liner the labeller prints.
  If the teacher disagrees a lot on yes/no, lower `--alpha` (trust the intended label more).
  If it misjudges maybe/unsure, edit `SYSTEM` / `FEWSHOT` in `scripts/lib/teacher.js`.
- Qwen3-style thinking models: the scripts send `/no_think` and `chat_template_kwargs.enable_thinking=false`.
  If answers still start with `<think>`, the probe's `thinkingLeaks` will say so; pick a non-thinking model.
- Optional extra: re-label the seed data with the teacher for a softer target:
  `npm run unsloth:label -- --in data/seed.train.jsonl --out data/teacher.seed.jsonl --alpha 0.4`.
- **Never** label `data/test.jsonl` into training data (only `unsloth:eval` reads it).

### Phase 2: distil into the tiny model (minutes, CPU)

```bash
npm run train:distilled            # = train-tiny --data data/seed.train.jsonl,data/teacher.jsonl
npm run eval                       # compare with the 76% baseline
node scripts/train-tiny.js --data data/seed.train.jsonl,data/teacher.jsonl --buckets 32768 --dim 24 --hidden 48 --out models/tiny-big
node scripts/eval.js --model models/tiny-big/model.bin
```

Acceptance: test accuracy above baseline, yes/no recall up, maybe/unsure not worse, file ideally < 1 MB.
Things to try if yes/no stays weak: more teacher data (yes/no especially), `--char 3-4`, `--trigrams true`,
larger `--buckets`, more epochs with `--select acc`. Commit the best `models/tiny/model.bin`.

### Phase 3: fine-tune a small LLM on the 3060 (optional)

```bash
npm run unsloth:export -- --soft-copies 1     # -> data/studio/{train,eval}.{chat,sharegpt,alpaca}.jsonl + studio/system_prompt.txt
```

**Option A, Studio UI** (documented path):

1. New training run → base model `unsloth/SmolLM2-135M-Instruct` (smallest), or `unsloth/SmolLM2-360M-Instruct` /
   `unsloth/Qwen3-0.6B` (smarter). All fit 12 GB easily.
2. Upload `data/studio/train.chat.jsonl` (or the ShareGPT/Alpaca variant if the picker wants that), eval = `eval.chat.jsonl`.
3. Settings: LoRA r=16, alpha=16, dropout 0, lr 2e-4, 2 epochs, max seq len 256, batch 16–32, **train on responses
   only** if offered, chat template matching the base model.
4. After training: export **GGUF q8_0 and q4_k_m** + merged 16-bit; load the fine-tuned model in Studio for inference.
5. If the UI can export a YAML config, save it as `studio/finetune.yaml` so future runs are repeatable.

**Option B, API**: only if Phase 0 found training routes (write `scripts/studio-train-api.js`).

**Option C, script on the 3060 PC**: `python studio/train_answer_head.py --data data/seed.train.jsonl data/teacher.jsonl`
(untested; it trains with a soft cross-entropy on the four answer tokens, which is better than plain SFT for probabilities).

Then:

```bash
npm run unsloth:eval -- --llm-model <fine-tuned-id> --fewshot false   # compare to the big teacher
```

- If the fine-tuned model beats the big teacher on the test set, re-label with it (`--model <id> --fewshot false`) and redo Phase 2.
- Browser LLM tier: copy the q4 GGUF to `models/llm/`, then build `web/llm.html` with wllama
  (`@wllama/wllama` from a CDN), same SYSTEM prompt, read the logits of the first generated token for the 4 answer words,
  and reuse `src/horoscope.js`. Keep the tiny model as the default; the LLM page is opt-in (~100+ MB download).

### Phase 4: polish ideas

- `npm publish`-ready package (exports already set in package.json; `files` ships only `src/` + `models/tiny/`).
- Publish `web/` as a shareable page (needs the model inlined or hosted next to it).
- Horoscope: Venus retrograde, eclipses, a "rising sign" if birth time is given, per-sign daily notes text.
- Let the horoscope be learned instead of hand-tuned: add zodiac/moon tokens as features and train on (deliberately
  silly) astro-conditioned labels. Fun, pointless, on brand.

## File map

```
.env                         Studio URL + key (git-ignored, never commit)
PLAN.md                      this file
README.md                    usage
package.json                 npm scripts (no dependencies)
src/
  features.js                tokenizer + hashed features (shared by training & inference)
  model.js                   tiny model runtime + BDM1 (de)serialization + loadModel()
  horoscope.js               astrology layer
  bdm.js                     public API: createDecider()
models/tiny/model.bin        the model (model.json = human-readable header + metrics)
data/
  seed.train.jsonl / seed.val.jsonl   templated seed data (rebuild: npm run data:seed)
  test.jsonl                 hand-written test set, 100 rows, never train on it
  teacher.candidates.jsonl   (Phase 1) LLM-generated sentences
  teacher.jsonl              (Phase 1) LLM-labelled soft targets
  studio/                    (Phase 3) fine-tune exports
scripts/
  build-seed-dataset.js  train-tiny.js  eval.js  cli.js  serve.js  selftest.js
  probe-unsloth.js  teacher-generate.js  teacher-label.js  export-studio-dataset.js  mock-unsloth.js
  lib/unsloth.js  lib/teacher.js  lib/metrics.js
studio/
  system_prompt.txt          judge prompt (generated by unsloth:export, used by the python trainer)
  train_answer_head.py       fallback trainer for the 3060 (untested)
web/index.html               demo page (npm run demo → http://localhost:5173/web/)
```
