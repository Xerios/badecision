"""Which frozen, publicly hosted model makes the best "front processor"?
For each candidate: embed every training sentence once (frozen), train a small MLP head on the teacher's soft
labels, score on the test set handwritten by a human AI (data/test.jsonl, never trained on).
  HF_HOME=.cache/hf .venv/bin/python py/probe_frontends.py bge-small bge-base smollm2-135m
"""
import json, sys, time
import torch, torch.nn as nn, torch.nn.functional as F
from transformers import AutoModel, AutoTokenizer

torch.manual_seed(0)
LABELS = ["yes", "no", "maybe", "unsure"]
CANDIDATES = {
    "bge-small": ("BAAI/bge-small-en-v1.5", "cls"),
    "bge-base": ("BAAI/bge-base-en-v1.5", "cls"),
    "minilm-l6": ("sentence-transformers/all-MiniLM-L6-v2", "mean"),
    "smollm2-135m": ("HuggingFaceTB/SmolLM2-135M-Instruct", "llm"),
    "smollm2-360m": ("HuggingFaceTB/SmolLM2-360M-Instruct", "llm"),
    "qwen2.5-0.5b": ("Qwen/Qwen2.5-0.5B-Instruct", "llm"),
}

def rows(path):
    return [json.loads(l) for l in open(path) if l.strip()]

train = []
for p in ["data/teacher.jsonl", "data/omen.teacher.jsonl", "data/seed.train.jsonl"]:
    for r in rows(p):
        train.append((r["text"], r["probs"] if p != "data/omen.teacher.jsonl" else r["teacher"]))
test = [(r["text"], LABELS.index(r["label"])) for r in rows("data/test.jsonl")]

@torch.no_grad()
def embed(name, texts, bs=64):
    repo, kind = CANDIDATES[name]
    tok = AutoTokenizer.from_pretrained(repo)
    model = AutoModel.from_pretrained(repo, torch_dtype=torch.float32).eval()
    out = []
    for i in range(0, len(texts), bs):
        batch = texts[i:i + bs]
        if kind == "llm":
            tok.padding_side = "left"
            if tok.pad_token is None: tok.pad_token = tok.eos_token
            msgs = [tok.apply_chat_template([{"role": "user", "content": f"Is this true, false, uncertain, or unknowable? {t}"}], tokenize=False, add_generation_prompt=True) for t in batch]
            enc = tok(msgs, return_tensors="pt", padding=True)
            hs = model(**enc, output_hidden_states=True).hidden_states
            L = len(hs) - 1
            # last token, from a few layers (middle layers usually carry the most "truth" signal)
            feats = torch.cat([hs[l][:, -1] for l in (L // 2, (3 * L) // 4, L)], -1)
        else:
            enc = tok(batch, return_tensors="pt", padding=True, truncation=True, max_length=128)
            h = model(**enc).last_hidden_state
            if kind == "cls": feats = h[:, 0]
            else:
                m = enc["attention_mask"].unsqueeze(-1).float()
                feats = (h * m).sum(1) / m.sum(1)
        out.append(feats)
    return torch.cat(out)

def fit(X, Y, Xt, yt, hidden=256, epochs=60):
    mu, sd = X.mean(0), X.std(0) + 1e-6
    X, Xt = (X - mu) / sd, (Xt - mu) / sd
    head = nn.Sequential(nn.Dropout(0.2), nn.Linear(X.shape[1], hidden), nn.GELU(), nn.Dropout(0.2), nn.Linear(hidden, 4))
    opt = torch.optim.AdamW(head.parameters(), lr=1e-3, weight_decay=0.05)
    for ep in range(epochs):
        head.train()
        perm = torch.randperm(len(X))
        for i in range(0, len(X), 256):
            idx = perm[i:i + 256]
            loss = -(Y[idx] * F.log_softmax(head(X[idx]), -1)).sum(-1).mean()
            opt.zero_grad(); loss.backward(); opt.step()
    head.eval()
    with torch.no_grad():
        p = F.softmax(head(Xt), -1)
    acc = (p.argmax(-1) == yt).float().mean().item()
    nll = -torch.log(p[torch.arange(len(yt)), yt].clamp_min(1e-6)).mean().item()
    rec = [((p.argmax(-1) == yt) & (yt == c)).sum().item() / max(1, (yt == c).sum().item()) for c in range(4)]
    return acc, nll, rec

texts = [t for t, _ in train]
Y = torch.tensor([p for _, p in train], dtype=torch.float32)
Y = Y / Y.sum(-1, keepdim=True)
yt = torch.tensor([y for _, y in test])
for name in sys.argv[1:]:
    t0 = time.time()
    X = embed(name, texts)
    Xt = embed(name, [t for t, _ in test])
    acc, nll, rec = fit(X, Y, Xt, yt)
    print(f"{name:14s} dim {X.shape[1]:5d}  test acc {acc*100:5.1f}%  nll {nll:.3f}  recall " +
          " ".join(f"{l} {r*100:3.0f}%" for l, r in zip(LABELS, rec)) + f"   ({time.time()-t0:.0f}s, n_train {len(texts)})", flush=True)
