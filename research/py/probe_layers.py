"""Per-layer probe for a frozen LLM front processor: how deep do we need to run it?
  HF_HOME=.cache/hf .venv/bin/python py/probe_layers.py HuggingFaceTB/SmolLM2-360M-Instruct
"""
import json, sys, time
import torch, torch.nn as nn, torch.nn.functional as F
from transformers import AutoModel, AutoTokenizer
torch.manual_seed(0)
LABELS = ["yes", "no", "maybe", "unsure"]
repo = sys.argv[1]
PROMPT = "Is this true, false, uncertain, or unknowable? {}"
rows = lambda p: [json.loads(l) for l in open(p) if l.strip()]
train = [(r["text"], r["probs"]) for r in rows("data/teacher.jsonl") + rows("data/seed.train.jsonl")] + [(r["text"], r["teacher"]) for r in rows("data/omen.teacher.jsonl")]
test = [(r["text"], LABELS.index(r["label"])) for r in rows("data/test.jsonl")]
tok = AutoTokenizer.from_pretrained(repo); tok.padding_side = "left"
model = AutoModel.from_pretrained(repo, torch_dtype=torch.float32).eval()

@torch.no_grad()
def feats(texts, bs=64):
    out = None
    for i in range(0, len(texts), bs):
        msgs = [tok.apply_chat_template([{"role": "user", "content": PROMPT.format(t)}], tokenize=False, add_generation_prompt=True) for t in texts[i:i + bs]]
        hs = model(**tok(msgs, return_tensors="pt", padding=True), output_hidden_states=True).hidden_states
        h = torch.stack([x[:, -1] for x in hs], 1)  # [B, L+1, D] last token, every layer
        out = h if out is None else torch.cat([out, h])
    return out

t0 = time.time()
X, Xt = feats([t for t, _ in train]), feats([t for t, _ in test])
print(f"features: {tuple(X.shape)} in {time.time()-t0:.0f}s", flush=True)
Y = torch.tensor([p for _, p in train], dtype=torch.float32); Y = Y / Y.sum(-1, keepdim=True)
yt = torch.tensor([y for _, y in test])

def fit(A, At):
    mu, sd = A.mean(0), A.std(0) + 1e-6
    A, At = (A - mu) / sd, (At - mu) / sd
    head = nn.Sequential(nn.Dropout(0.2), nn.Linear(A.shape[1], 256), nn.GELU(), nn.Dropout(0.2), nn.Linear(256, 4))
    opt = torch.optim.AdamW(head.parameters(), lr=1e-3, weight_decay=0.05)
    for _ in range(40):
        head.train(); perm = torch.randperm(len(A))
        for i in range(0, len(A), 256):
            idx = perm[i:i + 256]
            loss = -(Y[idx] * F.log_softmax(head(A[idx]), -1)).sum(-1).mean()
            opt.zero_grad(); loss.backward(); opt.step()
    head.eval()
    with torch.no_grad(): p = F.softmax(head(At), -1)
    return (p.argmax(-1) == yt).float().mean().item(), -torch.log(p[torch.arange(len(yt)), yt].clamp_min(1e-6)).mean().item()

L = X.shape[1] - 1
for l in list(range(2, L + 1, 2)) + ([L] if L % 2 else []):
    acc, nll = fit(X[:, l], Xt[:, l])
    print(f"layer {l:2d}/{L}  acc {acc*100:5.1f}%  nll {nll:.3f}", flush=True)
for combo in [(L // 2, (3 * L) // 4, L), (L // 3, L // 2), (L // 2, (2 * L) // 3)]:
    acc, nll = fit(torch.cat([X[:, l] for l in combo], -1), torch.cat([Xt[:, l] for l in combo], -1))
    print(f"layers {combo}  acc {acc*100:5.1f}%  nll {nll:.3f}", flush=True)
