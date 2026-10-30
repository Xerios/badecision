"""Reference forward pass for the "serious" front processor: SmolLM2-360M-Instruct, Q4_0 GGUF (bartowski), first N layers.

Exactly what the JS/WASM runtime computes (GGUF conventions: weights as stored, llama.cpp "normal" RoPE on adjacent
pairs, since the converter permuted q/k for it), so features used to train the head match the runtime.

  .venv/bin/python scripts/py/smol_ref.py check            # compare against HF transformers (fp32) on a few prompts
  .venv/bin/python scripts/py/smol_ref.py features         # -> .cache/serious-features.pt (train + test sets)
"""
import json, math, sys, time
import numpy as np
import torch
import torch.nn.functional as F
from gguf import GGUFReader
from gguf.quants import dequantize

GGUF_PATH = ".cache/gguf/SmolLM2-360M-Instruct-Q4_0.gguf"
HF_REPO = "HuggingFaceTB/SmolLM2-360M-Instruct"
N_LAYERS = 20          # run (and download) only the first 20 of 32 blocks
PROMPT = "Is this true, false, uncertain, or unknowable? {}"
SYSTEM = "You are a helpful AI assistant named SmolLM, trained by Hugging Face"


def chat(text):
    """SmolLM2's chat template (default system prompt), as a string. The JS runtime builds the same string."""
    return (f"<|im_start|>system\n{SYSTEM}<|im_end|>\n<|im_start|>user\n{PROMPT.format(text)}<|im_end|>\n"
            f"<|im_start|>assistant\n")


class Smol:
    def __init__(self, path=GGUF_PATH, n_layers=N_LAYERS):
        r = GGUFReader(path)
        f = lambda k: r.fields[k].contents()
        self.dim, self.n_head, self.n_kv = f("llama.embedding_length"), f("llama.attention.head_count"), f("llama.attention.head_count_kv")
        self.hd = self.dim // self.n_head
        self.eps, self.theta = f("llama.attention.layer_norm_rms_epsilon"), f("llama.rope.freq_base")
        self.n_layers = n_layers
        T = {t.name: t for t in r.tensors}
        W = lambda name: torch.from_numpy(np.ascontiguousarray(dequantize(T[name].data, T[name].tensor_type))).float()
        self.emb = W("token_embd.weight")  # [vocab, dim]
        self.layers = []
        for i in range(n_layers):
            p = f"blk.{i}."
            self.layers.append({k: W(p + k + ".weight") for k in ["attn_norm", "attn_q", "attn_k", "attn_v", "attn_output", "ffn_norm", "ffn_gate", "ffn_up", "ffn_down"]})

    def rms(self, x, w):
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps) * w

    def rope(self, x, pos):  # x [B, T, H, hd], adjacent pairs (llama.cpp ROPE_TYPE_NORM)
        i = torch.arange(0, self.hd, 2, dtype=torch.float32)
        freq = self.theta ** (-i / self.hd)
        ang = pos[:, :, None].float() * freq  # [B, T, hd/2]
        c, s = torch.cos(ang)[:, :, None, :], torch.sin(ang)[:, :, None, :]
        x0, x1 = x[..., 0::2], x[..., 1::2]
        return torch.stack([x0 * c - x1 * s, x0 * s + x1 * c], -1).flatten(-2)

    @torch.no_grad()
    def hidden(self, ids_list):
        """Hidden state of the last token after N_LAYERS blocks, for each id sequence (no padding semantics)."""
        B, L = len(ids_list), max(len(x) for x in ids_list)
        ids = torch.zeros(B, L, dtype=torch.long)
        lens = torch.tensor([len(x) for x in ids_list])
        for b, x in enumerate(ids_list): ids[b, :len(x)] = torch.tensor(x)
        pos = torch.arange(L)[None].expand(B, L)
        valid = torch.arange(L)[None] < lens[:, None]               # right padding
        mask = torch.tril(torch.ones(L, L, dtype=torch.bool))[None] & valid[:, None, :]
        h = self.emb[ids]
        rep = self.n_head // self.n_kv
        for w in self.layers:
            x = self.rms(h, w["attn_norm"])
            q = (x @ w["attn_q"].T).view(B, L, self.n_head, self.hd)
            k = (x @ w["attn_k"].T).view(B, L, self.n_kv, self.hd)
            v = (x @ w["attn_v"].T).view(B, L, self.n_kv, self.hd)
            q, k = self.rope(q, pos), self.rope(k, pos)
            k, v = k.repeat_interleave(rep, 2), v.repeat_interleave(rep, 2)
            att = torch.einsum("bthd,bshd->bhts", q, k) / math.sqrt(self.hd)
            att = att.masked_fill(~mask[:, None], float("-inf")).softmax(-1)
            o = torch.einsum("bhts,bshd->bthd", att, v).reshape(B, L, self.dim)
            h = h + o @ w["attn_output"].T
            x = self.rms(h, w["ffn_norm"])
            h = h + (F.silu(x @ w["ffn_gate"].T) * (x @ w["ffn_up"].T)) @ w["ffn_down"].T
        return h[torch.arange(B), lens - 1]


def tokenizer():
    from transformers import AutoTokenizer
    return AutoTokenizer.from_pretrained(HF_REPO)


def encode(tok, texts):
    return [tok(chat(t), add_special_tokens=False)["input_ids"] for t in texts]


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
    tok = tokenizer()
    if cmd == "check":
        from transformers import AutoModelForCausalLM
        texts = ["Fire is hot", "Sharks are mammals", "Should I buy the red car?"]
        hf = AutoModelForCausalLM.from_pretrained(HF_REPO, torch_dtype=torch.float32).eval()
        ref = Smol()
        for t, ids in zip(texts, encode(tok, texts)):
            assert tok.apply_chat_template([{"role": "user", "content": PROMPT.format(t)}], tokenize=False, add_generation_prompt=True) == chat(t)
            with torch.no_grad():
                hs = hf(torch.tensor([ids]), output_hidden_states=True).hidden_states[N_LAYERS][0, -1]
            mine = ref.hidden([ids])[0]
            print(f"{t!r:32} tokens {len(ids)}  cos(HF fp32, Q4_0 ref) = {F.cosine_similarity(hs, mine, 0).item():.4f}")
    elif cmd == "features":
        rows = lambda p: [json.loads(l) for l in open(p) if l.strip()]
        LABELS = ["yes", "no", "maybe", "unsure"]
        train = [(r["text"], r["probs"]) for r in rows("data/teacher.jsonl") + rows("data/seed.train.jsonl")] + \
                [(r["text"], r["teacher"]) for r in rows("data/omen.teacher.jsonl")]
        test = [(r["text"], LABELS.index(r["label"])) for r in rows("data/test.jsonl")]
        ref = Smol()
        out = {}
        for name, data in [("test", test), ("train", train)]:
            ids = encode(tok, [t for t, _ in data])
            order = sorted(range(len(ids)), key=lambda i: len(ids[i]))  # bucket by length
            feats = torch.zeros(len(ids), ref.dim)
            t0 = time.time()
            for s in range(0, len(order), 64):
                idx = order[s:s + 64]
                feats[idx] = ref.hidden([ids[i] for i in idx])
                if s % 2048 == 0: print(f"  {name} {s}/{len(ids)} {time.time() - t0:.0f}s", flush=True)
            out[name] = {"texts": [t for t, _ in data], "x": feats, "y": [y for _, y in data]}
        torch.save(out, ".cache/serious-features.pt")
        print("wrote .cache/serious-features.pt")
