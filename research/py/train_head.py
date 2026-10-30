"""Train the serious model's head on frozen front-processor features (.cache/serious-features.pt, from smol_ref.py).
Standardize -> Linear -> GELU -> Linear, soft teacher labels, temperature fitted on a 5% holdout.
  .venv/bin/python py/train_head.py [--hidden 128] [--epochs 60]
Writes ../packages/core/models/serious/head.json (float32 arrays, base64) for packages/core/src/smol.js makeHead().
"""
import argparse, base64, json, os
import torch, torch.nn as nn, torch.nn.functional as F

ap = argparse.ArgumentParser()
ap.add_argument("--hidden", type=int, default=128)
ap.add_argument("--epochs", type=int, default=60)
ap.add_argument("--dropout", type=float, default=0.2)
ap.add_argument("--seed", type=int, default=0)
ap.add_argument("--out", default="../packages/core/models/serious/head.json")
ap.add_argument("--target", choices=["blend", "teacher"], default="teacher", help="blend: teacher mixed with the generator's intended label; teacher: the teacher alone")
a = ap.parse_args()
torch.manual_seed(a.seed)
LABELS = ["yes", "no", "maybe", "unsure"]

d = torch.load(".cache/serious-features.pt")
X, Y = d["train"]["x"], torch.tensor(d["train"]["y"], dtype=torch.float32)
if a.target == "teacher":  # the teacher's own probabilities where we have them (sharper; it scores 99% on the test set)
    raw = {}
    for f in ["data/teacher.jsonl", "data/omen.teacher.jsonl"]:
        for l in open(f):
            if l.strip(): r = json.loads(l); raw[r["text"]] = r["teacher"]
    Y = torch.tensor([raw.get(t, y) for t, y in zip(d["train"]["texts"], d["train"]["y"])], dtype=torch.float32)
Y = Y / Y.sum(-1, keepdim=True)
Xt, yt = d["test"]["x"], torch.tensor(d["test"]["y"])
perm = torch.randperm(len(X))
hold, tr = perm[: len(X) // 20], perm[len(X) // 20:]
mu, sd = X[tr].mean(0), X[tr].std(0) + 1e-6
norm = lambda x: (x - mu) / sd

head = nn.Sequential(nn.Dropout(a.dropout), nn.Linear(X.shape[1], a.hidden), nn.GELU(), nn.Dropout(a.dropout), nn.Linear(a.hidden, 4))
opt = torch.optim.AdamW(head.parameters(), lr=1e-3, weight_decay=0.05)
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, a.epochs)
for ep in range(a.epochs):
    head.train()
    p = tr[torch.randperm(len(tr))]
    for i in range(0, len(p), 256):
        idx = p[i:i + 256]
        loss = -(Y[idx] * F.log_softmax(head(norm(X[idx])), -1)).sum(-1).mean()
        opt.zero_grad(); loss.backward(); opt.step()
    sched.step()
head.eval()

with torch.no_grad():
    lh = head(norm(X[hold]))
    # temperature: maximize the likelihood of the teacher's top answer on the holdout (soft targets would keep it timid)
    hard = Y[hold].argmax(-1)
    best = min((F.cross_entropy(lh / T, hard).item(), T) for T in [x / 40 for x in range(8, 81)])
    T = best[1]
    p = F.softmax(head(norm(Xt)) / T, -1)
acc = (p.argmax(-1) == yt).float().mean().item()
nll = -torch.log(p[torch.arange(len(yt)), yt].clamp_min(1e-6)).mean().item()
conf, pred = p.max(-1)
ece = 0.0
for lo in [i / 10 for i in range(10)]:
    m = (conf > lo) & (conf <= lo + 0.1)
    if m.any(): ece += m.float().mean().item() * abs(conf[m].mean().item() - (pred[m] == yt[m]).float().mean().item())
rec = [((pred == yt) & (yt == c)).sum().item() / max(1, (yt == c).sum().item()) for c in range(4)]
print(f"mean confidence {conf.mean().item():.3f}  ", end="")
print(f"hidden {a.hidden}  T {T:.2f}  test acc {acc*100:.1f}%  nll {nll:.3f}  ece {ece:.3f}  recall " + " ".join(f"{l} {r*100:.0f}%" for l, r in zip(LABELS, rec)))
for i in torch.nonzero(pred != yt).flatten().tolist():
    print(f"  [{LABELS[yt[i]]} -> {LABELS[pred[i]]} {conf[i]:.2f}] {d['test']['texts'][i]}")

b64 = lambda t: base64.b64encode(t.detach().float().contiguous().numpy().tobytes()).decode()
lin1, lin2 = head[1], head[4]
os.makedirs(os.path.dirname(a.out), exist_ok=True)
json.dump({
    "format": "badecision-head/1", "frontProcessor": "bartowski/SmolLM2-360M-Instruct-GGUF@7be6f65f Q4_0, 20 layers, last token",
    "dim": X.shape[1], "hidden": a.hidden, "temperature": T, "labels": LABELS,
    "test": {"accuracy": round(acc, 4), "nll": round(nll, 4), "ece": round(ece, 4)}, "trainRows": len(tr),
    "mu": b64(mu), "sd": b64(sd), "W1": b64(lin1.weight), "b1": b64(lin1.bias), "W2": b64(lin2.weight), "b2": b64(lin2.bias),
}, open(a.out, "w"))
print("wrote", a.out, f"{os.path.getsize(a.out) / 1024:.0f} KB")
