# Bad Decision Model: plan & runbook

> **For a fresh Claude session:** read this file top to bottom, then run _Phase 0_. Everything marked ✅ is built and
> tested; everything marked 🔲 is the work left. The Unsloth parts were written **without access to the server**
> (network was blocked when this was built), so treat them as "should work, verify first". A mock server
> (`pnpm run unsloth:mock`) emulates the API and the whole pipeline passes against it (`pnpm test`).

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

## Current state (2026-10-30, read this first)

**Update (later on 2026-10-30): the shipped "serious" model is a frozen front processor + head**, because the user
can't host large files and wants ≤ 200 MB. `badecision`'s `seriously` API downloads SmolLM2-360M-Instruct (Q4_0 GGUF,
`bartowski/SmolLM2-360M-Instruct-GGUF@7be6f65f`, only token embeddings + blocks 0-19 = 161.5 MB via 4 Range requests)
from Hugging Face, caches it, runs it in `packages/badecision/kernel/smol_kernel.c`, and a 960→128→4 head
(`models/serious/head.json`, trained on the Qwen teacher's probabilities) answers. Omens/dates/mood/Opposite Day are
the same rules as the tiny model. **92% plain test, 97.5% omen test**, ~0.2-0.4 s/answer on one core, 0.5 s start
from cache.

How it was chosen (`scripts/py/probe_frontends.py`, frozen features + MLP, plain test): MiniLM-L6 84%, bge-small 82%,
bge-base 85%, SmolLM2-135M 81%, Qwen2.5-0.5B 89%, SmolLM2-360M 96% (fp32, layers 16+24+32). `probe_layers.py`: layer
20 alone 95%, the last layer only 88% (so ONNX/transformers.js, which only expose logits, would lose ~7 points).
Q4_0 weights cost ~3 points (92-93% across head seeds). Rebuild: `smol_ref.py features` (~10 min CPU) →
`train_head.py` → `pnpm run pkg:build`. The decision model in Studio (v3, trained on the local 3080 Ti, 5.5 GB peak)
scores 91% / 90% and stays the Studio backend.

Ideas: run `seriously` in a Web Worker in browsers; distil more teacher data (more facts → better head); store the
head as f16 to halve its 650 KB.

The product is now **two backends behind one API** (`src/bdm.js`), sharing the horoscope layer:

| backend | what | plain test | omen test | runs |
| --- | --- | --- | --- | --- |
| `createStudioDecider()` (main) | **Unsloth decision model**: Laya (ModernBERT-large, 395M) + decision head, fine-tuned in Studio, served at `POST /v1/systemone` | **92%** | **93%** | Studio GPU now; GGUF Q8_0/Q4_K_M exported for CPU (llama.cpp) |
| `createDecider()` (fallback) | tiny hashed-feature model, pure JS, 323 KB | 76% | 87% | anywhere, ~1 ms |

- **Horoscope, deeper**: daily readings now contain **omens** (`src/omens.js`): "Avoid red", "Large numbers bring
  misfortune", "Travel is favoured", "Music is shrouded in mystery". Users can pass their own text (`horoscope:`).
  An omen applies only when the question matches its topic (27 topics: 9 colours, 6 number rules, 12 life areas).
  A matching omen moves 75% of the open (maybe/unsure) mass to its answer and 15% of yes/no, so decisions follow it
  and facts only wobble; "Should I *avoid*/*cancel* …" flips the advice. The decision model gets the horoscope as part
  of its input (`decisionState`) and learned this from data, generalising past the word lists ("seventh attempt" +
  "the number 7 is lucky" works). The tiny model applies the same rules in code. Mood (moon, Mercury, weekday,
  sign) stays a post-hoc tilt for both.
- **Opposite Day** (January 25, `src/horoscope.js`): yes and no swap, hardcoded, independent of horoscope strength;
  `oppositeDay: false` disables it.
- **Decision model training** (`scripts/studio-train-decision.js`, API, no UI): uploads `data/decision/*.jsonl`
  (`{state, questions, gold}`, built by `scripts/build-decision-dataset.js` from teacher + omen + seed data, 30k rows:
  every sentence without horoscope, with a random one, and 2 extra with a matching omen for omen-topic sentences),
  `POST /api/train/start {is_decision: true, model_name: "convaiinnovations/laya"}`, 2 epochs, lr 8e-4, r 64,
  early stopping. ~23 min on the 3060. v1 (4 epochs, omen rule in log space) learned to ignore omens (40% on the
  omen test) because the teacher's sharp probabilities almost never flipped; the mass-moving rule + matched copies fixed it.
- Studio's Decision API is set to `laya-ft:convaiinnovations_laya__project-bad-decision-v2_1793329621`; GGUFs in
  `~/.unsloth/studio/outputs/convaiinnovations_laya__project-bad-decision-v2_1793329621/gguf` on the Studio PC.
- Studio also ships CPU decision models (`julia-1` 0.2 GB, `laya-gguf` 0.4 GB, `kev-0.8b`) and bigger ones
  (`kev-9b`, `clef-flash`); `/api/settings/systemone` lists them.
- Known misses (v2): a few plain facts ("Snakes are reptiles" → no 0.97 although the data says yes), and omens
  over-applied (5 euros treated as a large number; a purple omen applied to a green bicycle).
- **Next**: run the exported GGUF on CPU (Studio Decision API with device=cpu, or llama.cpp directly) and decide how
  the browser demo reaches it (local Studio vs. a bundled CPU runtime); distil v2 into the tiny model (re-label with
  `/v1/systemone`, ~25 ms/row); retrain with a matched-omen *negative* set (omens on unrelated topics) to curb over-application.

## Architecture (decided)

```
            ┌───────────────── training (one-off) ─────────────────┐
seed data ─►│ templates + facts handwritten by a human AI (no GPU) │
            │ Studio LLM generates + scores sentences (3060)       │──► soft labels ──► tiny model (JS, CPU, seconds)
            │ optional: fine-tune small LLM in Studio (3060)       │
            └──────────────────────────────────────────────────────┘
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
- **Reachable from the Claude session** (2026-10-30): each sandboxed command must list `<studio-ip>:8888` as an allowed
  host (that's what fixed the 403), plus the `NODE_USE_ENV_PROXY` vars below for Node scripts.
- **Phase 0 findings** (Studio `v0.1.912-beta`, full route list in `studio/openapi.json`, 690 routes):
  - The API is **not** inference-only. Present: `/v1/load` + `/v1/unload` (load a model, e.g.
    `{"model_path":"unsloth/Qwen3.5-9B-GGUF","gguf_variant":"UD-Q4_K_XL","max_seq_length":8192,"n_parallel":4,"disable_vision":true}`),
    `/api/inference/loaded-models`, OpenAI-style `/v1/fine_tuning/jobs` (create/list/events/checkpoints/cancel/pause/resume),
    `/api/train/{start,stop,status,metrics,runs,hardware}`, `/api/datasets/upload`, `/api/export/export/{gguf,merged,lora}`,
    `/api/hub/download`, and per-checkpoint inference at `/p/{run}/{checkpoint}/v1/chat/completions`.
  - `/v1/models` lists every *installed* model (incl. TTS/image ones); the probe now uses `/api/inference/loaded-models`.
  - **Chat endpoint rejects `logprobs`**, but `/v1/completions` (llama.cpp) returns top-20 logprobs. The judge's
    `completion` method renders the prompt as ChatML itself and reads first-token probabilities (auto-selected for
    ChatML models such as Qwen3.5). Far better than `json` mode (which gave 50/50 yes/no on "My neighbour owns 14 spoons").
  - Installed text LLMs: Qwen3.5-9B (UD-Q4_K_XL downloaded), Qwen3.5-4B, gemma-4-E4B-it, gpt-oss-20b, LFM2.5-24B-A2B.
  - **Teacher = Qwen3.5-9B UD-Q4_K_XL: 99% on `data/test.jsonl`** (90% before adding "absurd is unsure" + 3 few-shots to
    `SYSTEM`; slightly optimistic since the prompt was tuned looking at the misses, with different example sentences).

## Status

|     | Item                                                                                            | Where                                                                                            |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| ✅  | Feature extraction (hashing, negation-aware)                                                    | `src/features.js`                                                                                |
| ✅  | Tiny model runtime, BDM1 format, Node + browser                                                 | `src/model.js`                                                                                   |
| ✅  | Public API `createDecider().decide(text, {astro, birthday, date})`                              | `src/bdm.js`                                                                                     |
| ✅  | Horoscope layer                                                                                 | `src/horoscope.js`                                                                               |
| ✅  | Seed dataset: 2,876 rows, soft labels                                                           | `scripts/build-seed-dataset.js` → `data/seed.*.jsonl`                                            |
| ✅  | Test set handwritten by a human AI (100 rows, 25/label, never used for training)                | `data/test.jsonl`                                                                                |
| ✅  | JS trainer with class balancing, int8 quantization, temperature calibration                     | `scripts/train-tiny.js`                                                                          |
| ✅  | Baseline model trained (323 KB, **76% test accuracy**)                                          | `models/tiny/model.bin`                                                                          |
| ✅  | CLI, browser demo, static server, eval, self-tests                                              | `scripts/cli.js`, `web/index.html`, `scripts/serve.js`, `scripts/eval.js`, `scripts/selftest.js` |
| ✅  | Unsloth client, probe, generator, labeller (logprobs → json → sampling fallbacks)               | `scripts/lib/*.js`, `scripts/probe-unsloth.js`, `scripts/teacher-*.js`                           |
| ✅  | Studio fine-tune dataset export (chat / ShareGPT / Alpaca)                                      | `scripts/export-studio-dataset.js`                                                               |
| ✅  | Mock Unsloth server + pipeline test                                                             | `scripts/mock-unsloth.js`, `pnpm test`                                                            |
| ⚠️  | Fallback Python trainer for the 3060 (soft-label answer-token LoRA + GGUF export). **Untested** | `studio/train_answer_head.py`                                                                    |
| ✅  | Phase 0: reach the real Studio, record capabilities                                             | findings above                                                                                   |
| ✅  | Phase 1: 4,623 unique sentences generated + labelled (6k requested, rest were duplicates)      | `data/teacher.jsonl`                                                                             |
| ⚠️  | Phase 2: distilled, **no real gain** (77% vs 76%); baseline kept as default, see results below | `models/exp-distilled`, `models/exp-big`                                                         |
| ✅  | Phase 3: Unsloth **decision model** trained via API (Laya v2: 92% plain, 93% omens), GGUF exported | `scripts/studio-train-decision.js`, `scripts/studio-export-decision.js`                       |
| ✅  | Omens + own horoscope text + Opposite Day, in both backends                                      | `src/omens.js`, `src/horoscope.js`, `src/decision.js`, `data/omen-test.jsonl`                  |
| 🔲  | Phase 4: polish (browser LLM tier page, npm package, publish demo)                              | below                                                                                            |

### Baseline numbers (seed data only, `pnpm run eval`)

```
accuracy 76.0%   (test set handwritten by a human AI, n=100)
class    precision  recall
yes         62%      72%     <- needs knowledge (distillation)
no          61%      56%     <- needs knowledge
maybe       89%      96%
unsure      95%      80%
```

### Phase 1–2 results (2026-10-30, teacher Qwen3.5-9B, `completion` judge, alpha 0.7)

- Generation: 237 batches → 4,623 unique rows (yes 1223 / no 1039 / maybe 1092 / unsure 1269), ~10 min.
- Teacher disagreed with the generator's intended label on ~800 rows; spot checks say the teacher is usually right
  (generator wrote "Pluto is a planet" as yes). Known teacher blind spot: with thinking off it calls true **arithmetic
  statements** false ("Nine minus three equals six" → no 0.99, any prompt framing; the question form is fine, and
  thinking mode fixes it at 6–24 s/row). Affects only a handful of rows.

| model (`--data seed.train,teacher`)          | test acc | ECE   | yes | no  | maybe | unsure | size   |
| -------------------------------------------- | -------- | ----- | --- | --- | ----- | ------ | ------ |
| baseline (seed only), **kept as default**    | 76%      | 0.292 | 72% | 56% | 96%   | 80%    | 323 KB |
| distilled, default config (`exp-distilled`)  | 77%      | 0.228 | 76% | 72% | 88%   | 72%    | 323 KB |
| `--buckets 32768 --dim 24 --hidden 48` (`exp-big`) | 74% | 0.142 | 52% | 80% | 92%  | 72%    | 904 KB |
| `--char 3-4` / `--trigrams` / `--select loss` / all-big | 71–75% | 0.13–0.25 | | |   |        |        |

(recall per class; n=100 so ±4 pts is noise.) Distillation improves calibration but not accuracy: 45/50 test
yes/no facts have all their content words in the teacher data, yet a hashed bag-of-words can't bind word pairs
("sharks"+"mammals" → no). Next levers: far more fact coverage (tens of thousands of short facts), or rely on
the Phase 3 LLM tier for knowledge.

## Runbook

All commands from the project root, Node ≥ 20, **pnpm** (not npm; `packageManager` is pinned), no install needed (zero deps).

### Phase 0: connectivity & capabilities (5 min)

```bash
pnpm test                      # 9 offline checks incl. mock-API pipeline, must pass first
pnpm run unsloth:probe         # hits the real server from .env
```

The probe writes `studio/probe-report.json` and `studio/openapi.json` and prints:

- `models`: which model is loaded. **The labeller needs a capable model loaded** (good picks for 12 GB: Qwen3-8B
  Q4, Qwen3-4B, Llama-3.1-8B Q4, Gemma-3-4B). If only a tiny model is loaded, load a bigger one in the Studio UI
  or via `POST /v1/load` (see Environment facts).
- `chatLogprobs` / `completionLogprobs`: if either is ✔, the judge uses real token probabilities (best). If both ✘,
  it falls back to asking for JSON probabilities (noisier).
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

Verified 2026-10-30: works once the command's sandbox allows `<studio-ip>:8888`.

**Blocked (403 / allowlist / ECONNREFUSED)?** Check the allowlist entry is the bare host `<studio-ip>`, that Studio
is running and listening on the LAN (not just localhost), and that the key is valid (401 = bad key). Last resort:
run Phases 1–3 on a machine on the LAN; they're plain Node scripts.

### Phase 1: generate & label with the Studio LLM (~1 h on a 3060, rough guess)

```bash
pnpm run unsloth:generate -- --per-label 1500 --batch 25 --concurrency 4   # -> data/teacher.candidates.jsonl
pnpm run unsloth:label -- --alpha 0.7 --concurrency 4                       # -> data/teacher.jsonl
pnpm run unsloth:eval                                                       # how good is the teacher on the test set?
```

- Both scripts are **resumable** (re-run after a crash, they skip finished work) and dedupe.
- Quality check: `head -50 data/teacher.candidates.jsonl`; inspect disagreements with the one-liner the labeller prints.
  If the teacher disagrees a lot on yes/no, lower `--alpha` (trust the intended label more).
  If it misjudges maybe/unsure, edit `SYSTEM` / `FEWSHOT` in `scripts/lib/teacher.js`.
- Qwen3-style thinking models: the scripts send `/no_think` and `chat_template_kwargs.enable_thinking=false`.
  If answers still start with `<think>`, the probe's `thinkingLeaks` will say so; pick a non-thinking model.
- Optional extra: re-label the seed data with the teacher for a softer target:
  `pnpm run unsloth:label -- --in data/seed.train.jsonl --out data/teacher.seed.jsonl --alpha 0.4`.
- **Never** label `data/test.jsonl` into training data (only `unsloth:eval` reads it).

### Phase 2: distil into the tiny model (minutes, CPU)

```bash
pnpm run train:distilled            # = train-tiny --data data/seed.train.jsonl,data/teacher.jsonl
pnpm run eval                       # compare with the 76% baseline
node scripts/train-tiny.js --data data/seed.train.jsonl,data/teacher.jsonl --buckets 32768 --dim 24 --hidden 48 --out models/tiny-big
node scripts/eval.js --model models/tiny-big/model.bin
```

Acceptance: test accuracy above baseline, yes/no recall up, maybe/unsure not worse, file ideally < 1 MB.
Things to try if yes/no stays weak: more teacher data (yes/no especially), `--char 3-4`, `--trigrams true`,
larger `--buckets`, more epochs with `--select acc`. Commit the best `models/tiny/model.bin`.

### Phase 3: fine-tune a small LLM on the 3060 (optional)

```bash
pnpm run unsloth:export -- --soft-copies 1     # -> data/studio/{train,eval}.{chat,sharegpt,alpaca}.jsonl + studio/system_prompt.txt
```

**Option A, Studio UI** (documented path):

1. New training run → base model `unsloth/SmolLM2-135M-Instruct` (smallest), or `unsloth/SmolLM2-360M-Instruct` /
   `unsloth/Qwen3-0.6B` (smarter). All fit 12 GB easily.
2. Upload `data/studio/train.chat.jsonl` (or the ShareGPT/Alpaca variant if the picker wants that), eval = `eval.chat.jsonl`.
3. Settings: LoRA r=16, alpha=16, dropout 0, lr 2e-4, 2 epochs, max seq len 256, batch 16–32, **train on responses
   only** if offered, chat template matching the base model.
4. After training: export **GGUF q8_0 and q4_k_m** + merged 16-bit; load the fine-tuned model in Studio for inference.
5. If the UI can export a YAML config, save it as `studio/finetune.yaml` so future runs are repeatable.

**Option B, API**: Phase 0 found training routes (`/v1/fine_tuning/jobs`, `/api/train/*`, `/api/datasets/upload`, `/api/export/*`); write `scripts/studio-train-api.js` against `studio/openapi.json`.

**Option C, script on the 3060 PC**: `python studio/train_answer_head.py --data data/seed.train.jsonl data/teacher.jsonl`
(untested; it trains with a soft cross-entropy on the four answer tokens, which is better than plain SFT for probabilities).

Then:

```bash
pnpm run unsloth:eval -- --llm-model <fine-tuned-id> --fewshot false   # compare to the big teacher
```

- If the fine-tuned model beats the big teacher on the test set, re-label with it (`--model <id> --fewshot false`) and redo Phase 2.
- Browser LLM tier: copy the q4 GGUF to `models/llm/`, then build `web/llm.html` with wllama
  (`@wllama/wllama` from a CDN), same SYSTEM prompt, read the logits of the first generated token for the 4 answer words,
  and reuse `src/horoscope.js`. Keep the tiny model as the default; the LLM page is opt-in (~100+ MB download).

### Phase 4: polish ideas

- ✅ npm package: `packages/badecision/` (TypeScript, WASM kernel, inlined model, sync API). `pnpm run pkg:build`,
  `pnpm run pkg:test`; publish from `packages/badecision/` with `npm publish`.
- Publish `web/` as a shareable page (needs the model inlined or hosted next to it).
- Horoscope: Venus retrograde, eclipses, a "rising sign" if birth time is given, per-sign daily notes text.
- Let the horoscope be learned instead of hand-tuned: add zodiac/moon tokens as features and train on (deliberately
  silly) astro-conditioned labels. Fun, pointless, on brand.

## File map

New since the decision model: `src/omens.js` (omen topics, matching, rules, `decisionState`), `src/decision.js` (Decision API
contract + client), `scripts/generate-omen-sentences.js` → `data/omen.candidates.jsonl` → `data/omen.teacher.jsonl`,
`scripts/build-decision-dataset.js` → `data/decision/`, `scripts/studio-train-decision.js`, `scripts/studio-export-decision.js`,
`scripts/eval-decision.js` (`--backend tiny|studio`, both test sets), `data/omen-test.jsonl` (30 rows handwritten by a human AI, never trained on).

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
  seed.train.jsonl / seed.val.jsonl   templated seed data (rebuild: pnpm run data:seed)
  test.jsonl                 test set handwritten by a human AI, 100 rows, never train on it
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
web/index.html               demo page (pnpm run demo → http://localhost:5173/web/)
```
