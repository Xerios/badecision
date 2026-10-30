// The serious model: a frozen SmolLM2-360M-Instruct (the "front processor", downloaded from Hugging Face on first
// use, ~163 MB, cached) feeding a small trained head that ships in this package. Same horoscope, omens and Opposite
// Day as the tiny model; only loading is asynchronous. Nothing here runs at import time, and nothing of it ends up
// in a bundle that doesn't import `seriously`.

import { loadSmol, makeHead, SMOL } from './core/smol.js';
import { makeDecider } from './core/decider.js';
import { fromBase64 } from './engine.js';
import { SMOL_KERNEL_BASE64 } from './generated/smol-kernel-data.js';
import { HEAD } from './generated/head-data.js';
import { currentSign, defaultState, newState, now, random, ymd, applyConfig, type State } from './config.js';
import { ASTRO } from './ask.js';
import { luckyNumberIn } from './lucky.js';
import { BadDecisionError } from './errors.js';
import type { CoreDecision, Decider } from './engine.js';
import type { Config, Decision, IsItResult, IsItTrueResult, NerdyDecision, Probs, Verdict } from './types.js';

export interface LoadOptions {
  /** Where the GGUF file lives. Defaults to the pinned Hugging Face URL. Must serve HTTP Range requests. */
  url?: string;
  /** Cache downloaded weights (Cache API in browsers, a directory in Node). Default true. */
  cache?: boolean;
  /** Node only: cache directory. Default $BADECISION_CACHE or ~/.cache/badecision. */
  cacheDir?: string;
  /** Called while downloading: bytes done, bytes total. */
  onProgress?: (done: number, total: number) => void;
  /** Custom fetch (proxies, tests). */
  fetch?: typeof fetch;
}

export interface SeriousInfo {
  url: string;
  bytes: number;
  layers: number;
  /** Test-set numbers of the shipped head. */
  test: { accuracy: number; nll: number; ece: number };
}

type NodeFs = {
  existsSync(p: string): boolean; mkdirSync(p: string, o: { recursive: boolean }): void;
  readFileSync(p: string): Uint8Array; writeFileSync(p: string, d: Uint8Array): void; renameSync(a: string, b: string): void;
};

// Node built-ins without importing them (keeps dist/ bundler-safe): process.getBuiltinModule, Node >= 20.16
const builtin = <T>(name: string): T | undefined => {
  const p = (globalThis as { process?: { getBuiltinModule?: (n: string) => unknown } }).process;
  return p?.getBuiltinModule?.(name) as T | undefined;
};

/** fetchRange with a cache: Cache API in browsers, files in Node, nothing elsewhere. */
export function rangeFetcher(o: LoadOptions): (start: number, end: number) => Promise<ArrayBuffer> {
  const url = o.url ?? SMOL.url;
  const f = o.fetch ?? globalThis.fetch;
  const download = async (start: number, end: number) => {
    const res = await f(url, { headers: { Range: `bytes=${start}-${end - 1}` } });
    if (res.status !== 206 && !(res.status === 200 && start === 0)) throw new Error(`Downloading the serious model failed: HTTP ${res.status} ${url}`);
    const buf = await res.arrayBuffer();
    return res.status === 200 ? buf.slice(0, end - start) : buf;
  };
  if (o.cache === false) return download;
  const key = `${SMOL.revision}-${start0(url)}`;

  const fs = builtin<NodeFs>('node:fs');
  const os = builtin<{ homedir(): string }>('node:os');
  if (fs && os) {
    const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
    const dir = o.cacheDir ?? env.BADECISION_CACHE ?? `${os.homedir()}/.cache/badecision`;
    return async (start, end) => {
      const file = `${dir}/${key}-${start}-${end}.bin`;
      try {
        if (fs.existsSync(file)) { const b = fs.readFileSync(file); if (b.length === end - start) return b.buffer.slice(b.byteOffset, b.byteOffset + b.length) as ArrayBuffer; }
      } catch { /* unreadable cache: download again */ }
      const buf = await download(start, end);
      try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(`${file}.tmp`, new Uint8Array(buf)); fs.renameSync(`${file}.tmp`, file); } catch { /* read-only: no cache */ }
      return buf;
    };
  }
  const caches = (globalThis as { caches?: CacheStorage }).caches;
  if (caches) {
    return async (start, end) => {
      const req = `https://badecision.cache/${key}/${start}-${end}`;
      try {
        const c = await caches.open('badecision');
        const hit = await c.match(req);
        if (hit) return await hit.arrayBuffer();
        const buf = await download(start, end);
        await c.put(req, new Response(buf)).catch(() => {});
        return buf;
      } catch { return download(start, end); }
    };
  }
  return download;
}
const start0 = (url: string) => url.split('/').pop()!.replace(/[^A-Za-z0-9._-]/g, '_');

interface Loaded { decider: Decider; info: SeriousInfo }
let loading: Promise<Loaded> | undefined;

/**
 * Download (or read from cache) and start the serious model. Called automatically by every `seriously` function;
 * call it yourself to preload or to show progress. Repeated calls share one load; a failed load can be retried.
 */
export function load(options: LoadOptions = {}): Promise<SeriousInfo> {
  return loaded(options).then((l) => l.info);
}
function loaded(options: LoadOptions): Promise<Loaded> {
  if (loading) return loading;
  loading = (async () => {
    const smol = await loadSmol({ fetchRange: rangeFetcher(options), kernel: fromBase64(SMOL_KERNEL_BASE64) as BufferSource, onProgress: options.onProgress });
    const head = makeHead({
      mu: f32(HEAD.mu), sd: f32(HEAD.sd), W1: f32(HEAD.W1), b1: f32(HEAD.b1), W2: f32(HEAD.W2), b2: f32(HEAD.b2),
      hidden: HEAD.hidden, temperature: HEAD.temperature,
    });
    const decider = makeDecider({ predict: (text: string) => head(smol.hidden(text)) }) as unknown as Decider;
    return { decider, info: { url: options.url ?? SMOL.url, bytes: smol.bytes, layers: SMOL.layers, test: HEAD.test } };
  })();
  loading.catch(() => { loading = undefined; });
  return loading;
}
const f32 = (b64: string) => new Float32Array(fromBase64(b64).buffer);

const RESULTS: Record<Verdict, IsItResult> = { yes: 'true', no: 'false', maybe: 'maybe', unsure: 'maybe' };
const TRUE_RESULTS: Record<Verdict, IsItTrueResult> = { yes: 'true', no: false, maybe: null, unsure: null };

async function ask(state: State, question: string): Promise<{ r: CoreDecision; date: Date }> {
  const { decider } = await loaded({});
  const date = now(state);
  return { r: decider.decide(String(question), { astro: ASTRO, sign: currentSign(state).name, date }), date };
}

export interface Seriously {
  load: typeof load;
  isIt(question: string): Promise<IsItResult>;
  isItTrue(question: string): Promise<IsItTrueResult>;
  isItTrueStrict(question: string): Promise<'true'>;
  isItFalse(question: string): Promise<boolean>;
  isItTrulyTrue(question: string): Promise<false>;
  feelingLucky(question: string): Promise<boolean>;
  decide(question: string, nerdy?: false): Promise<Decision>;
  decide(question: string, nerdy: true): Promise<NerdyDecision>;
  /** A separate set with its own settings (sign or birthday, date), like create(). */
  create(config?: Config): Seriously & { configure(config: Config): void };
}

function seriouslyFor(stateOf: () => State): Seriously {
  const isIt = async (q: string) => RESULTS[(await ask(stateOf(), q)).r.verdict];
  const decide = async (q: string, nerdy = false): Promise<Decision | NerdyDecision> => {
    const state = stateOf();
    const { r, date } = await ask(state, q);
    const d: Decision = { question: r.text, verdict: r.verdict, confidence: r.confidence };
    if (!nerdy) return d;
    return {
      ...d, probs: r.probs as Probs, model: r.model as Probs, sign: currentSign(state), luckyNumber: luckyNumberIn(state), date: ymd(date),
      oppositeDay: r.oppositeDay, starsChangedIt: Boolean(r.starsChangedIt), omenHits: r.omenHits, notes: r.stars.notes, engine: 'serious',
    };
  };
  return {
    load,
    isIt,
    async isItTrue(q) { return TRUE_RESULTS[(await ask(stateOf(), q)).r.verdict]; },
    async isItTrueStrict(q) { const a = await isIt(q); if (a !== 'true') throw new BadDecisionError(q, a); return a; },
    async isItFalse(q) {
      const state = stateOf();
      const { r } = await ask(state, q);
      const a = RESULTS[r.verdict];
      return a !== 'maybe' ? a === 'false' : random(state) * (r.probs.yes + r.probs.no) < r.probs.no;
    },
    async isItTrulyTrue(q) { await ask(stateOf(), q); return false; },
    async feelingLucky(q) {
      const state = stateOf();
      const { probs } = (await ask(state, q)).r;
      return Math.min(100, Math.max(1, 1 + Math.floor(random(state) * 100) + Math.round((probs.yes - probs.no) * 40))) > luckyNumberIn(state);
    },
    decide: decide as Seriously['decide'],
    create(config = {}) { const s = newState(config); return { ...seriouslyFor(() => s), configure: (c: Config) => applyConfig(s, c) }; },
  };
}

/**
 * The serious model, asynchronously. Same functions as the synchronous API, same horoscope, much better judgement:
 *   await seriously.isItTrue('Sharks are mammals')    // false
 * The first call downloads ~163 MB from Hugging Face (cached afterwards); `await seriously.load()` to preload.
 */
export const seriously: Seriously = /* @__PURE__ */ seriouslyFor(defaultState);
