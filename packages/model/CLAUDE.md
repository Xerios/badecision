# model (`@badecision/model`)

- **All scripts run with `packages/model/` as the working directory** (paths like `data/test.jsonl` are relative to it;
  `scripts/lib/unsloth.js` exports `ROOT` = packages/model/, `REPO`, `CORE`).
- `scripts/`: training, eval, CLI, Unsloth tooling, the mock Studio. `scripts/selftest.js` checks the Unsloth
  pipeline against the mock.
- `py/`: Python (uv venv in `packages/model/.venv/`, CPU torch, `HF_HOME=.cache/hf`): `probe_frontends.py` /
  `probe_layers.py` (pick a front processor), `smol_ref.py` (reference forward + training features),
  `train_head.py` (the head).
- `models/exp-*`: experiments. `.cache/` (gitignored): HF cache, the local GGUF, features.
