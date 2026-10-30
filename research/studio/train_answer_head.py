#!/usr/bin/env python3
"""
FALLBACK trainer: run this directly ON THE 3060 PC (inside the Python env that has Unsloth installed)
if the Studio UI/API route doesn't work out. UNTESTED in this repo (it was written without GPU access);
expect to fix small API drift on first run.

What it does
  Fine-tunes a small instruct LLM with LoRA so that, given the SYSTEM prompt and a sentence, the very
  next token is one of: yes / no / maybe / unsure. The loss is a SOFT cross-entropy restricted to those
  four answer tokens, so the model learns graded probabilities (not just the argmax).
  Then merges the LoRA, saves 16-bit safetensors and GGUF (q8_0 + q4_k_m) for Studio / llama.cpp / wllama.

Usage
  pip install unsloth   # if not already there
  python studio/train_answer_head.py --data data/seed.train.jsonl data/teacher.jsonl \
        --base unsloth/SmolLM2-135M-Instruct --out models/llm --epochs 2

  Bigger/smarter options that fit a 12 GB 3060: unsloth/SmolLM2-360M-Instruct, unsloth/Qwen3-0.6B, unsloth/Qwen2.5-0.5B-Instruct
"""
import os
os.environ.setdefault("UNSLOTH_RETURN_LOGITS", "1")  # we need real logits for a custom loss

import argparse, json, math, random
import torch
import torch.nn.functional as F

LABELS = ["yes", "no", "maybe", "unsure"]
SYSTEM = open(os.path.join(os.path.dirname(__file__), "system_prompt.txt")).read().strip()


def read_rows(paths):
    rows = []
    for p in paths:
        with open(p) as fh:
            for line in fh:
                if not line.strip():
                    continue
                r = json.loads(line)
                probs = r.get("probs") or [1.0 if l == r["label"] else 0.0 for l in LABELS]
                s = sum(probs)
                rows.append((r["text"], [x / s for x in probs]))
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", nargs="+", default=["data/seed.train.jsonl"])
    ap.add_argument("--eval", default="data/test.jsonl")
    ap.add_argument("--base", default="unsloth/SmolLM2-135M-Instruct")
    ap.add_argument("--out", default="models/llm")
    ap.add_argument("--epochs", type=float, default=2)
    ap.add_argument("--lr", type=float, default=2e-4)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--rank", type=int, default=16)
    ap.add_argument("--max-len", type=int, default=256)
    ap.add_argument("--no-gguf", action="store_true")
    args = ap.parse_args()

    from unsloth import FastLanguageModel

    model, tok = FastLanguageModel.from_pretrained(args.base, max_seq_length=args.max_len, load_in_4bit=False, dtype=None)
    model = FastLanguageModel.get_peft_model(
        model, r=args.rank, lora_alpha=args.rank, lora_dropout=0.0,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        use_gradient_checkpointing="unsloth", random_state=0,
    )
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    tok.padding_side = "right"  # we gather logits at the last real token

    # first token id of each answer word, as the chat template would emit it
    label_ids = []
    for l in LABELS:
        ids = tok.encode(l, add_special_tokens=False)
        label_ids.append(ids[0])
    assert len(set(label_ids)) == 4, f"answer words share a first token: {label_ids}"
    label_ids_t = torch.tensor(label_ids)

    def prompt(text):
        msgs = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": text}]
        kw = {"enable_thinking": False} if "qwen3" in args.base.lower() else {}
        return tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True, **kw)

    rows = read_rows(args.data)
    random.Random(0).shuffle(rows)
    print(f"{len(rows)} training rows; label token ids {dict(zip(LABELS, label_ids))}")

    def batches(data, bs):
        for i in range(0, len(data), bs):
            chunk = data[i:i + bs]
            enc = tok([prompt(t) for t, _ in chunk], return_tensors="pt", padding=True, truncation=True,
                      max_length=args.max_len, add_special_tokens=False)
            last = enc["attention_mask"].sum(1) - 1
            yield enc, last, torch.tensor([p for _, p in chunk])

    opt = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=args.lr, weight_decay=0.0)
    steps = math.ceil(len(rows) / args.batch) * math.ceil(args.epochs)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=args.lr, total_steps=steps, pct_start=0.05)
    dev = model.device
    model.train()
    step = 0
    for ep in range(math.ceil(args.epochs)):
        random.Random(ep).shuffle(rows)
        for enc, last, target in batches(rows, args.batch):
            enc = {k: v.to(dev) for k, v in enc.items()}
            out = model(**enc)
            logits = out.logits[torch.arange(len(last)), last.to(dev)]          # [B, vocab] at the answer slot
            sub = logits[:, label_ids_t.to(dev)].float()                       # [B, 4]
            # soft CE over the 4 answers + a small term pushing mass onto the answer tokens overall
            loss = -(target.to(dev) * F.log_softmax(sub, -1)).sum(-1).mean()
            loss = loss + 0.1 * -(torch.logsumexp(sub, -1) - torch.logsumexp(logits.float(), -1)).mean()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step(); sched.step(); opt.zero_grad(set_to_none=True)
            step += 1
            if step % 20 == 0:
                print(f"epoch {ep} step {step}/{steps} loss {loss.item():.4f}")
            if step >= steps:
                break

    # quick eval on the test set handwritten by a human AI
    FastLanguageModel.for_inference(model)
    if os.path.exists(args.eval):
        test = [json.loads(l) for l in open(args.eval) if l.strip()]
        correct = 0
        with torch.no_grad():
            for i in range(0, len(test), 32):
                chunk = test[i:i + 32]
                enc = tok([prompt(r["text"]) for r in chunk], return_tensors="pt", padding=True, add_special_tokens=False).to(dev)
                last = enc["attention_mask"].sum(1) - 1
                sub = model(**enc).logits[torch.arange(len(chunk)), last][:, label_ids_t.to(dev)]
                pred = sub.argmax(-1).tolist()
                correct += sum(LABELS[p] == r["label"] for p, r in zip(pred, chunk))
        print(f"test accuracy: {correct}/{len(test)} = {correct / len(test):.1%}")

    os.makedirs(args.out, exist_ok=True)
    model.save_pretrained_merged(os.path.join(args.out, "merged16"), tok, save_method="merged_16bit")
    if not args.no_gguf:
        for q in ["q8_0", "q4_k_m"]:
            model.save_pretrained_gguf(os.path.join(args.out, f"gguf-{q}"), tok, quantization_method=q)
    json.dump({"base": args.base, "labels": LABELS, "label_token_ids": label_ids, "system": SYSTEM},
              open(os.path.join(args.out, "bdm-llm.json"), "w"), indent=2)
    print(f"saved to {args.out}")


if __name__ == "__main__":
    main()
