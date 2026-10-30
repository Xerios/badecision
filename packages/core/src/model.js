// Tiny decision model runtime. Zero dependencies, works in browsers, Node, Deno, Bun, workers.
//
// Architecture (fastText-style + one hidden layer):
//   ids    = hash(features(text)) % buckets
//   v      = mean(E[ids])                 E: buckets x dim, int8 with per-row scale
//   h      = act(U v + c)                 U: hidden x dim, act = leaky relu (default) | tanh | sq
//   logits = W h + b                      W: 4 x hidden
//   probs  = softmax(logits / temperature)
//
// File format (model.bin, little endian):
//   u32 magic 'BDM1' | u32 headerLen | header JSON (utf8, padded to 4 bytes)
//   f32[buckets] rowScale | i8[buckets*dim] E (padded to 4) | f32 U | f32 c | f32 W | f32 b

import { LABELS, featurize } from './features.js';

const MAGIC = 0x314d4442; // 'BDM1'
const ACTIVATIONS = { tanh: Math.tanh, relu: (z) => (z > 0 ? z : 0.01 * z), sq: (z) => z * z };

export class TinyModel {
  constructor(header, arrays) {
    this.header = header;
    Object.assign(this, arrays);
    this.labels = header.labels ?? LABELS;
  }

  static fromArrayBuffer(buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== MAGIC) throw new Error('Not a BDM1 model file');
    const hlen = dv.getUint32(4, true);
    const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, hlen)));
    const { buckets: B, dim: D, hidden: H } = header;
    let off = 8 + hlen;
    off += (4 - (off % 4)) % 4;
    const take = (Ctor, n) => {
      const a = new Ctor(buf.slice(off, off + n * Ctor.BYTES_PER_ELEMENT));
      off += n * Ctor.BYTES_PER_ELEMENT;
      off += (4 - (off % 4)) % 4;
      return a;
    };
    const rowScale = take(Float32Array, B);
    const E = take(Int8Array, B * D);
    const U = take(Float32Array, H * D);
    const c = take(Float32Array, H);
    const W = take(Float32Array, LABELS.length * H);
    const b = take(Float32Array, LABELS.length);
    return new TinyModel(header, { rowScale, E, U, c, W, b });
  }

  /** Raw logits (before temperature). */
  logits(text) {
    const { buckets: B, dim: D, hidden: H } = this.header;
    const ids = featurize(text, B, this.header.features);
    const v = new Float32Array(D);
    for (const id of ids) {
      const s = this.rowScale[id], o = id * D;
      for (let d = 0; d < D; d++) v[d] += this.E[o + d] * s;
    }
    if (ids.length) for (let d = 0; d < D; d++) v[d] /= ids.length;
    const act = ACTIVATIONS[this.header.activation ?? 'tanh'];
    const h = new Float32Array(H);
    for (let j = 0; j < H; j++) {
      let z = this.c[j];
      for (let d = 0; d < D; d++) z += this.U[j * D + d] * v[d];
      h[j] = act(z);
    }
    const K = this.labels.length, out = new Float32Array(K);
    for (let k = 0; k < K; k++) {
      let z = this.b[k];
      for (let j = 0; j < H; j++) z += this.W[k * H + j] * h[j];
      out[k] = z;
    }
    return out;
  }

  /** Returns { yes, no, maybe, unsure } probabilities summing to 1. */
  predict(text, { temperature = this.header.temperature ?? 1 } = {}) {
    const p = softmax(this.logits(text), temperature);
    return Object.fromEntries(this.labels.map((l, i) => [l, p[i]]));
  }
}

export function softmax(z, T = 1) {
  let m = -Infinity;
  for (const x of z) m = Math.max(m, x / T);
  const e = Array.from(z, (x) => Math.exp(x / T - m));
  const s = e.reduce((a, x) => a + x, 0);
  return e.map((x) => x / s);
}

/** Serialize model parts into a BDM1 ArrayBuffer (used by the trainer). */
export function serialize(header, { rowScale, E, U, c, W, b }) {
  const hbytes = new TextEncoder().encode(JSON.stringify(header));
  const pad = (n) => n + ((4 - (n % 4)) % 4);
  const parts = [rowScale, E, U, c, W, b];
  let size = pad(8 + hbytes.length);
  for (const p of parts) size += pad(p.byteLength);
  const buf = new ArrayBuffer(size);
  const dv = new DataView(buf);
  dv.setUint32(0, MAGIC, true);
  dv.setUint32(4, hbytes.length, true);
  new Uint8Array(buf, 8, hbytes.length).set(hbytes);
  let off = pad(8 + hbytes.length);
  for (const p of parts) {
    new Uint8Array(buf, off, p.byteLength).set(new Uint8Array(p.buffer, p.byteOffset, p.byteLength));
    off += pad(p.byteLength);
  }
  return buf;
}
