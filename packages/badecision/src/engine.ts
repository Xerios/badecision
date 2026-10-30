// The model runtime: inlined weights, executed by a WebAssembly kernel (kernel/bdm_kernel.c), with the plain-JS
// TinyModel as the fallback when WebAssembly is unavailable or blocked (CSP without 'wasm-unsafe-eval').
// Nothing happens at import time; the first call to engine() decodes the model and instantiates the kernel.

import { TinyModel } from '@badecision/core/model';
import { featurize } from '@badecision/core/features';
import { makeDecider } from '@badecision/core/decider';
import MODEL_BASE64 from '@badecision/core/models/tiny/model.bin?base64';
import KERNEL_BASE64 from '../kernel/bdm_kernel.wasm?base64';
import type { Decider } from './answers.js';

export type EngineName = 'wasm' | 'js';

interface Header { buckets: number; dim: number; hidden: number; activation?: string; features?: { char: number[]; trigrams: boolean } }
interface Weights { header: Header; rowScale: Float32Array; E: Int8Array; U: Float32Array; c: Float32Array; W: Float32Array; b: Float32Array }
interface Kernel {
  memory: WebAssembly.Memory;
  bdm_init(buckets: number, dim: number, hidden: number, activation: number): void;
  bdm_row_scale(): number; bdm_emb(): number; bdm_u(): number; bdm_c(): number; bdm_w(): number; bdm_b(): number;
  bdm_ids(n: number): number;
  bdm_forward(n: number): number;
}

const ACTIVATIONS: Record<string, number> = { relu: 0, tanh: 1, sq: 2 };

export const fromBase64 = (b64: string): Uint8Array => Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));

/** TinyModel with the forward pass in WebAssembly. Same numbers as the JS version (to ~1e-6). */
export class WasmModel extends TinyModel {
  readonly #k: Kernel;

  constructor(base: TinyModel, kernel: Uint8Array = fromBase64(KERNEL_BASE64)) {
    const w = base as unknown as Weights;
    super(w.header, w);
    const act = ACTIVATIONS[w.header.activation ?? 'tanh'];
    if (act === undefined) throw new Error(`Unsupported activation: ${w.header.activation}`);
    // the kernel is < 4 KB, small enough for synchronous compilation on a browser main thread
    const k = new WebAssembly.Instance(new WebAssembly.Module(kernel as BufferSource), {}).exports as unknown as Kernel;
    const { buckets: B, dim: D, hidden: H } = w.header;
    k.bdm_init(B, D, H, act);
    const mem = k.memory.buffer;
    new Float32Array(mem, k.bdm_row_scale(), B).set(w.rowScale);
    new Int8Array(mem, k.bdm_emb(), B * D).set(w.E);
    new Float32Array(mem, k.bdm_u(), H * D).set(w.U);
    new Float32Array(mem, k.bdm_c(), H).set(w.c);
    new Float32Array(mem, k.bdm_w(), 4 * H).set(w.W);
    new Float32Array(mem, k.bdm_b(), 4).set(w.b);
    this.#k = k;
  }

  /** Raw logits (before temperature). */
  override logits(text: string): Float32Array {
    const { header } = this as unknown as Weights;
    const ids: Int32Array = featurize(text, header.buckets, header.features);
    const k = this.#k;
    const at = k.bdm_ids(ids.length); // may grow memory, so read .buffer afterwards
    new Int32Array(k.memory.buffer, at, ids.length).set(ids);
    return new Float32Array(k.memory.buffer, k.bdm_forward(ids.length), 4).slice();
  }
}

/** Decode the inlined model and pick the fastest runtime that works here. */
export function loadEngine(): { model: TinyModel; engine: EngineName } {
  const base = TinyModel.fromArrayBuffer(fromBase64(MODEL_BASE64).buffer);
  try {
    return { model: new WasmModel(base), engine: 'wasm' };
  } catch {
    return { model: base, engine: 'js' };
  }
}

let loaded: { decider: Decider; engine: EngineName } | undefined;

/** The shared, lazily created engine. */
export function engine(): { decider: Decider; engine: EngineName } {
  if (!loaded) {
    const { model, engine } = loadEngine();
    loaded = { decider: makeDecider(model) as unknown as Decider, engine };
  }
  return loaded;
}
