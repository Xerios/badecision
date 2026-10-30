// The "serious" model: a frozen, publicly hosted LLM (SmolLM2-360M-Instruct, Q4_0 GGUF) read as a front processor,
// plus a small trained head. Only the token embeddings and the first 20 of 32 blocks are downloaded (~163 MB, HTTP
// Range requests against Hugging Face) and run in a WebAssembly kernel (packages/badecision/kernel/smol_kernel.c).
// The head turns the hidden state of the last prompt token into yes / no / maybe / unsure.
//
// Everything here must match packages/model/py/smol_ref.py, which produced the features the head was trained on.

import { parseGGUF, NeedMoreBytes } from './gguf.js';
import { BPETokenizer } from './bpe.js';
import { LABELS } from './features.js';

const REPO = 'bartowski/SmolLM2-360M-Instruct-GGUF';
const REVISION = '7be6f65f1db715fe5dc5a4634c0d459b4eed42ec'; // pinned: the head only fits these exact weights
const FILE = 'SmolLM2-360M-Instruct-Q4_0.gguf';
export const SMOL = {
  repo: REPO,
  revision: REVISION,
  file: FILE,
  url: `https://huggingface.co/${REPO}/resolve/${REVISION}/${FILE}`,
  layers: 20,
  maxTokens: 192,
  system: 'You are a helpful AI assistant named SmolLM, trained by Hugging Face',
  ask: 'Is this true, false, uncertain, or unknowable?',
};

// <|im_start|>system ... <|im_start|>user\n{ask} {question}<|im_end|>\n<|im_start|>assistant\n, split so the part before
// the question can be computed once. The prefix ends on "?", which never merges with the following " word".
const PREFIX = `<|im_start|>system\n${SMOL.system}<|im_end|>\n<|im_start|>user\n${SMOL.ask}`;
const SUFFIX = '<|im_end|>\n<|im_start|>assistant\n';
export const smolPrompt = (question) => `${PREFIX} ${question}${SUFFIX}`;

const TENSORS = ['attn_norm', 'attn_q', 'attn_k', 'attn_v', 'attn_output', 'ffn_norm', 'ffn_gate', 'ffn_up', 'ffn_down'];

/** Byte ranges [start, end) covering the given tensors, merged where they touch. */
export function byteRuns(tensors) {
  const s = [...tensors].sort((a, b) => a.offset - b.offset);
  const runs = [];
  for (const t of s) {
    const last = runs.at(-1);
    if (last && t.offset <= last.end) last.end = Math.max(last.end, t.offset + t.bytes);
    else runs.push({ start: t.offset, end: t.offset + t.bytes });
  }
  return runs;
}

/**
 * Load the front processor.
 * @param {object} o
 * @param {(start: number, end: number) => Promise<ArrayBuffer>} o.fetchRange   bytes [start, end) of the GGUF file
 * @param {BufferSource} o.kernel        the compiled smol_kernel.wasm
 * @param {(done: number, total: number) => void} [o.onProgress]
 */
export async function loadSmol({ fetchRange, kernel, onProgress = () => {}, layers = SMOL.layers, maxTokens = SMOL.maxTokens }) {
  let headerBytes = 2 << 20, header;
  for (;;) {
    try { header = parseGGUF(await fetchRange(0, headerBytes)); break; } catch (e) {
      if (!(e instanceof NeedMoreBytes) || headerBytes > 64 << 20) throw e;
      headerBytes = e.need;
    }
  }
  const { meta, tensors } = header;
  const arch = meta['general.architecture'];
  const get = (k) => meta[`${arch}.${k}`];
  const byName = new Map(tensors.map((t) => [t.name, t]));
  const wanted = ['token_embd.weight'];
  for (let l = 0; l < layers; l++) for (const n of TENSORS) wanted.push(`blk.${l}.${n}.weight`);
  const need = wanted.map((n) => { const t = byName.get(n); if (!t) throw new Error(`GGUF has no tensor ${n}`); return t; });

  const { instance } = await WebAssembly.instantiate(kernel, {});
  const k = instance.exports;
  const dim = get('embedding_length'), nh = get('attention.head_count'), nkv = get('attention.head_count_kv');
  const vocab = meta['tokenizer.ggml.tokens'].length;
  if (!k.sm_init(dim, nh, nkv, get('feed_forward_length'), layers, maxTokens, vocab, get('attention.layer_norm_rms_epsilon'))) throw new Error('Out of memory');

  // download the weights straight into WebAssembly memory, one request per contiguous run
  const runs = byteRuns(need);
  const total = runs.reduce((a, r) => a + r.end - r.start, 0);
  let done = 0;
  onProgress(0, total);
  for (const r of runs) {
    r.ptr = k.sm_alloc(r.end - r.start);
    if (!r.ptr) throw new Error('Out of memory');
  }
  await Promise.all(runs.map(async (r) => {
    const bytes = new Uint8Array(await fetchRange(r.start, r.end));
    if (bytes.length !== r.end - r.start) throw new Error(`Expected ${r.end - r.start} bytes, got ${bytes.length}`);
    new Uint8Array(k.memory.buffer, r.ptr, bytes.length).set(bytes);
    done += bytes.length;
    onProgress(done, total);
  }));
  const ptrOf = (t) => { const r = runs.find((x) => t.offset >= x.start && t.offset + t.bytes <= x.end); return r.ptr + (t.offset - r.start); };
  const emb = byName.get('token_embd.weight');
  k.sm_set_embedding(ptrOf(emb), emb.type);
  for (let l = 0; l < layers; l++) TENSORS.forEach((n, i) => { const t = byName.get(`blk.${l}.${n}.weight`); k.sm_set_tensor(l, i, ptrOf(t), t.type); });

  const hd = dim / nh, theta = get('rope.freq_base');
  const rope = new Float32Array(k.memory.buffer, k.sm_rope(), maxTokens * hd);
  for (let p = 0; p < maxTokens; p++) for (let i = 0; i < hd / 2; i++) {
    const a = p * Math.pow(theta, -(2 * i) / hd);
    rope[p * hd + 2 * i] = Math.cos(a);
    rope[p * hd + 2 * i + 1] = Math.sin(a);
  }

  const tok = new BPETokenizer(meta['tokenizer.ggml.tokens'], meta['tokenizer.ggml.merges'], meta['tokenizer.ggml.token_type']);
  const prefixIds = tok.encode(PREFIX);
  const setIds = (ids) => new Int32Array(k.memory.buffer, k.sm_ids(), ids.length).set(ids);
  const prime = () => { setIds(prefixIds); if (!k.sm_prefix(prefixIds.length)) throw new Error('Prefix does not fit'); };
  prime();
  const suffixIds = tok.encode(SUFFIX);

  /** Hidden state (Float32Array(dim)) of the last prompt token for a question. */
  function hidden(question) {
    let ids = tok.encode(smolPrompt(String(question).trim()));
    if (ids.length > maxTokens) ids = [...ids.slice(0, maxTokens - suffixIds.length), ...suffixIds]; // very long: keep the start
    const cached = prefixIds.every((id, i) => ids[i] === id);
    let ptr;
    if (cached) { setIds(ids.slice(prefixIds.length)); ptr = k.sm_forward(ids.length - prefixIds.length); } else { setIds(ids); ptr = k.sm_full(ids.length); }
    const h = new Float32Array(k.memory.buffer, ptr, dim).slice();
    if (!cached) prime();
    return h;
  }

  return { hidden, tokenizer: tok, dim, bytes: total, meta };
}

const erf = (x) => { // Abramowitz-Stegun 7.1.26, |error| < 1.5e-7
  const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a));
};

/**
 * The trained head: standardize -> Linear -> GELU -> Linear -> softmax(/T). Weights from packages/model/py/train_head.py.
 * @param {{ mu: Float32Array, sd: Float32Array, W1: Float32Array, b1: Float32Array, W2: Float32Array, b2: Float32Array, hidden: number, temperature: number }} w
 */
export function makeHead(w) {
  const D = w.mu.length, H = w.hidden;
  return function probs(x) {
    const z = new Float32Array(D);
    for (let i = 0; i < D; i++) z[i] = (x[i] - w.mu[i]) / w.sd[i];
    const h = new Float32Array(H);
    for (let j = 0; j < H; j++) {
      let s = w.b1[j];
      for (let i = 0, o = j * D; i < D; i++) s += w.W1[o + i] * z[i];
      h[j] = 0.5 * s * (1 + erf(s / Math.SQRT2));
    }
    const logits = LABELS.map((_, c) => { let s = w.b2[c]; for (let j = 0; j < H; j++) s += w.W2[c * H + j] * h[j]; return s / w.temperature; });
    const m = Math.max(...logits), e = logits.map((l) => Math.exp(l - m)), sum = e.reduce((a, b) => a + b, 0);
    return Object.fromEntries(LABELS.map((l, i) => [l, e[i] / sum]));
  };
}
