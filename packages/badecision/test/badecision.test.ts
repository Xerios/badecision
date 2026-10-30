// The test. There is one. It covers everything.
//   pnpm test    (after pnpm build)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

import * as bd from '../dist/index.js';
import { create, BadDecisionError, StringToBooleanFactory, type IsItResult } from '../dist/index.js';
import { WasmModel, loadEngine, fromBase64, engine } from '../dist/engine.js';
import { newState, currentSign, ASTRO_WARNING } from '../dist/config.js';
import { MODEL_BASE64 } from '../dist/generated/model-data.js';
import { TinyModel } from '../dist/core/model.js';
import { fnv1a } from '../dist/core/features.js';
import { moonPhase, mercuryRetrograde } from '../dist/core/horoscope.js';
import { createDecider } from '../../core/src/bdm.js';
import { rangeFetcher } from '../dist/serious.js';
import { SMOL_KERNEL_BASE64 } from '../dist/generated/smol-kernel-data.js';
import { existsSync, mkdtempSync, openSync, readSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH = join(PKG, '../../research');
const QUESTIONS: string[] = readFileSync(join(RESEARCH, 'data/test.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).text);
const DAY = new Date(2027, 0, 15, 12); // a Friday, waxing moon, Mercury direct
const day = (y: number, m: number, d: number) => new Date(y, m, d, 12);
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('badecision', async (t) => {
  // --- import does the basics: sessionStorage sign, today's date, nothing loaded until the first call
  globalThis.sessionStorage.setItem('badecision:sign', 'Pisces');
  assert.deepEqual(bd.sign(), { name: 'Pisces', glyph: '♓', element: 'water', source: 'random' });
  const first = bd.decide('wear pants today');
  assert.deepEqual(Object.keys(first), ['question', 'verdict', 'answer', 'confidence']);
  const nerdy = bd.decide('wear pants today', true);
  assert.equal(nerdy.engine, 'wasm');
  assert.equal(nerdy.date, ymd(new Date()));
  assert.equal(nerdy.sign.name, 'Pisces');
  assert.ok(nerdy.notes.length >= 4 && nerdy.luckyNumber >= 1 && nerdy.luckyNumber <= 99);
  assert.ok(Math.abs(Object.values(nerdy.probs).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.equal(bd.horoscope().date, ymd(new Date()));
  assert.equal(bd.luckyNumber(), nerdy.luckyNumber);
  assert.equal(typeof bd.feelingLucky('this condition is true'), 'boolean');

  // --- configure: birthday wins over sign, null reverts, validation, the cloud-only astro knob
  bd.configure({ sign: 'leo', date: DAY });
  assert.equal(bd.sign().source, 'chosen');
  bd.configure({ birthday: '1990-08-01' });
  assert.deepEqual(bd.sign(), { name: 'Leo', glyph: '♌', element: 'fire', source: 'birthday' });
  bd.configure({ birthday: null, sign: null });
  assert.equal(bd.sign().name, 'Pisces');
  assert.throws(() => bd.configure({ sign: 'Ophiuchus' as never }), /Unknown sign/);
  assert.throws(() => bd.configure({ birthday: 'yesterday-ish' }), /Invalid birthday/);
  assert.throws(() => bd.configure({ date: 'soon' }), /Invalid date/);
  const warn = t.mock.method(console, 'warn', () => {});
  const before = bd.decide('Should I buy the boat?', true);
  bd.configure({ astro: 1.5 } as never);
  bd.configure({ astro: 0 } as never);
  assert.deepEqual(warn.mock.calls.map((c) => c.arguments[0]), [ASTRO_WARNING]);
  assert.deepEqual(bd.decide('Should I buy the boat?', true), before);

  // --- WASM matches the JS model and the repo's own createDecider
  const js = TinyModel.fromArrayBuffer(fromBase64(MODEL_BASE64).buffer);
  const wasm = new WasmModel(js);
  for (const q of QUESTIONS) {
    const a = wasm.logits(q), b = js.logits(q);
    for (let k = 0; k < 4; k++) assert.ok(Math.abs(a[k] - b[k]) < 1e-4, q);
  }
  for (const activation of [undefined, 'sq']) { // no activation in the header = tanh
    const header = { ...js.header, activation };
    const [a, b] = [new WasmModel(new TinyModel(header, { ...js, header })), new TinyModel(header, { ...js, header })];
    for (const q of QUESTIONS.slice(0, 20)) a.logits(q).forEach((x, k) => assert.ok(Math.abs(x - b.logits(q)[k]) < 1e-3 * (1 + Math.abs(x)), `${activation ?? 'tanh'}: ${q}`));
  }
  assert.throws(() => new WasmModel(new TinyModel({ ...js.header, activation: 'gelu' }, { ...js, header: { ...js.header, activation: 'gelu' } })), /Unsupported activation/);
  assert.ok(wasm.logits('word '.repeat(5000)).every(Number.isFinite)); // grows the id buffer and memory
  const root = await createDecider();
  const leo = create({ sign: 'Leo', date: DAY });
  for (const q of QUESTIONS) {
    const mine = leo.decide(q, true), theirs = root.decide(q, { sign: 'Leo', date: DAY });
    assert.equal(mine.verdict, theirs.verdict, q);
  }

  // --- the answers
  const verdicts = new Map(QUESTIONS.map((q) => [q, leo.decide(q).verdict]));
  const find = (v: string) => QUESTIONS.find((q) => verdicts.get(q) === v)!;
  const [yesQ, noQ, maybeQ, unsureQ] = ['yes', 'no', 'maybe', 'unsure'].map(find);
  assert.ok(yesQ && noQ && maybeQ && unsureQ, 'the test set should produce all four verdicts');
  const expected: Record<string, IsItResult> = { yes: 'true', no: 'false', maybe: 'maybe', unsure: 'maybe' };
  for (const q of QUESTIONS) {
    const result = leo.isIt(q);
    assert.equal(result, expected[verdicts.get(q)!]);
    assert.equal(leo.isItTrue(q), { true: 'true', false: false, maybe: null }[result]); // only 'true' is truthy
    assert.equal(leo.isItTrulyTrue(q), false);
    if (result === 'true') assert.equal(leo.isItTrueStrict(q), 'true');
    else assert.throws(() => leo.isItTrueStrict(q), (e: unknown) => e instanceof BadDecisionError && e.result === result && e.question === q);
  }
  assert.match(new BadDecisionError('x', 'maybe').message, /only maybe true/);
  assert.match(new BadDecisionError('x', 'false').message, /not true/);
  assert.equal(leo.isItFalse(yesQ), false);
  assert.equal(leo.isItFalse(noQ), true);
  leo.configure({ random: () => 0 });
  assert.equal(leo.isItFalse(maybeQ), true);
  assert.equal(leo.feelingLucky(noQ), false); // a roll of 1 never beats the lucky number
  leo.configure({ random: () => 0.999999 });
  assert.equal(leo.isItFalse(unsureQ), false);
  assert.equal(leo.feelingLucky(yesQ), leo.luckyNumber() < 100);

  // default instance, PascalCase aliases are the same functions
  assert.equal(bd.IsIt, bd.isIt);
  assert.equal(bd.IsItTrue, bd.isItTrue);
  assert.equal(bd.IsItTrueStrict, bd.isItTrueStrict);
  assert.equal(bd.IsItFalse, bd.isItFalse);
  assert.equal(bd.IsItTrulyTrue, bd.isItTrulyTrue);
  bd.configure({ sign: 'Leo', random: () => 0 });
  assert.equal(bd.isItTrue(yesQ), 'true');
  assert.equal(bd.isItTrueStrict(yesQ), 'true');
  assert.equal(bd.isItFalse(noQ), true);
  assert.equal(bd.isItTrulyTrue('Fire is hot'), false);
  assert.equal(bd.isIt(maybeQ), 'maybe');

  // --- StringToBooleanFactory
  const factory = new StringToBooleanFactory();
  assert.equal(factory.initialized, false);
  assert.throws(() => factory.ConvertFromString('true'), /has not been initialized/);
  assert.equal(factory.initialize(), factory);
  assert.equal(factory.ConvertFromString(bd.isIt(yesQ)), true);
  assert.equal(factory.ConvertFromString('false'), false);
  assert.equal(factory.ConvertFromString(bd.isIt(maybeQ)), false);
  assert.throws(() => factory.ConvertFromString('yes'), TypeError);

  // --- lucky numbers: daily, per sign, with full moon (+7) and Mercury retrograde (digits reversed)
  const base = (sign: string, d: Date) => (fnv1a(`lucky|${sign}|${ymd(d)}`) % 99) + 1;
  const days = Array.from({ length: 400 }, (_, i) => day(2027, 0, 1 + i));
  const fullMoon = days.find((d) => moonPhase(d).name === 'Full Moon' && !mercuryRetrograde(d).retrograde)!;
  const retro = days.find((d) => mercuryRetrograde(d).retrograde && moonPhase(d).name !== 'Full Moon')!;
  const plain = days.find((d) => !mercuryRetrograde(d).retrograde && moonPhase(d).name !== 'Full Moon')!;
  const at = (d: Date) => create({ sign: 'Leo', date: d }).luckyNumber();
  assert.equal(at(plain), base('Leo', plain));
  assert.equal(at(fullMoon), ((base('Leo', fullMoon) + 6) % 99) + 1);
  assert.equal(at(retro), Number(String(base('Leo', retro)).split('').reverse().join('')));
  assert.equal(at(plain), at(plain));
  assert.notEqual(new Set(days.slice(0, 30).map(at)).size, 1);

  // --- create(): isolated instances, own random sign, horoscope
  const a = create({ birthday: day(1990, 7, 1), date: DAY }), b = create({ random: () => 0.5 });
  assert.equal(a.sign().name, 'Leo');
  assert.equal(b.sign().name, 'Cancer'); // SIGNS[6]
  assert.equal(b.sign().source, 'random');
  assert.equal(bd.sign().name, 'Leo');
  assert.equal(a.horoscope().sign?.name, 'Leo');
  assert.equal(a.horoscope().date, ymd(DAY));
  assert.ok(a.horoscope().notes.some((n) => n.includes('Friday')));

  // --- session storage edge cases: stored junk, broken storage, no storage
  const pick = (storage: unknown) => {
    const desc = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')!;
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get: () => { if (storage instanceof Error) throw storage; return storage; } });
    try { return currentSign(newState({ random: () => 0 }, true)); } finally { Object.defineProperty(globalThis, 'sessionStorage', desc); }
  };
  const memory = new Map<string, string>([['badecision:sign', 'Ophiuchus']]);
  assert.equal(pick({ getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v) }).name, 'Capricorn');
  assert.equal(memory.get('badecision:sign'), 'Capricorn');
  assert.equal(pick({ getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); } }).name, 'Capricorn');
  assert.equal(pick(new Error('sandboxed iframe')).name, 'Capricorn');
  assert.equal(pick(undefined).source, 'random');

  // --- no WebAssembly (strict CSP, old engines): plain JS, same answers
  const realWasm = globalThis.WebAssembly;
  delete (globalThis as { WebAssembly?: unknown }).WebAssembly;
  try {
    const fallback = loadEngine();
    assert.equal(fallback.engine, 'js');
    assert.deepEqual(fallback.model.predict('Fire is hot'), js.predict('Fire is hot'));
  } finally {
    globalThis.WebAssembly = realWasm;
  }
  assert.equal(engine(), engine());

  // --- works with require() (Node's require(esm)), and dist is bundler-safe
  const required = createRequire(import.meta.url)('../dist/index.js');
  assert.equal(typeof required.isItTrue, 'function');
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  for (const f of walk(join(PKG, 'dist')).filter((f) => f.endsWith('.js'))) {
    const src = readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /\bfrom\s*['"]node:|\bimport\(\s*['"]node:/, f);
    assert.ok(!src.includes('import.meta.url'), f);
  }

  // --- tree-shaking: the factory alone costs almost nothing, the model only comes with the model
  const bundle = async (contents: string) => (await esbuild.build({
    stdin: { contents, resolveDir: join(PKG, 'test'), loader: 'js' }, bundle: true, minify: true, write: false, format: 'esm', platform: 'browser',
  })).outputFiles[0].text;
  const small = await bundle("export { StringToBooleanFactory, BadDecisionError } from '../dist/index.js';");
  assert.ok(small.length < 1024, `factory + error bundle is ${small.length} B`);
  assert.ok(!small.includes(MODEL_BASE64.slice(0, 64)));
  const full = await bundle("export { isItTrue } from '../dist/index.js';");
  assert.ok(full.includes(MODEL_BASE64.slice(0, 64)));
  assert.ok(!full.includes(SMOL_KERNEL_BASE64.slice(0, 64)), 'the serious model stays out of bundles that do not use it');
  assert.ok((await bundle("export { seriously } from '../dist/index.js';")).includes(SMOL_KERNEL_BASE64.slice(0, 64)));

  // --- the serious model: frozen SmolLM2 front processor (served from the local GGUF instead of Hugging Face) + head
  const GGUF = join(RESEARCH, '.cache/gguf/SmolLM2-360M-Instruct-Q4_0.gguf');
  if (!existsSync(GGUF)) { t.diagnostic(`skipped the serious model: ${GGUF} missing (download it to test)`); return; }
  const fd = openSync(GGUF, 'r');
  const read = (s: number, e: number) => { const b = Buffer.alloc(e - s); readSync(fd, b, 0, e - s, s); return b; };
  let requests = 0;
  const hf = (async (_url: string, init?: RequestInit) => { // a Hugging Face stand-in: Range requests, or 200 for a plain GET
    requests++;
    const range = String((init?.headers as Record<string, string>)?.Range ?? '');
    const m = range.match(/^bytes=(\d+)-(\d+)$/);
    if (!m) return new Response(read(0, 1 << 20), { status: 200 });
    return new Response(read(+m[1], +m[2] + 1), { status: 206 });
  }) as typeof fetch;
  const cacheDir = mkdtempSync(join(tmpdir(), 'badecision-'));
  try {
    // range fetching and caching: Node files (miss, hit, corrupt, read-only), Cache API, none, 200 replies, errors
    const get = rangeFetcher({ fetch: hf, cacheDir });
    const a = new Uint8Array(await get(100, 200));
    assert.deepEqual([...a], [...read(100, 200)]);
    requests = 0;
    assert.deepEqual([...new Uint8Array(await get(100, 200))], [...a]);
    assert.equal(requests, 0, 'second read comes from the cache');
    const cached = readdirSync(cacheDir).find((f) => f.endsWith('-100-200.bin'))!;
    writeFileSync(join(cacheDir, cached), Buffer.alloc(3)); // wrong size: download again
    assert.deepEqual([...new Uint8Array(await get(100, 200))], [...a]);
    assert.equal(requests, 1);
    const ro = join(cacheDir, 'ro');
    writeFileSync(ro, '');
    assert.deepEqual([...new Uint8Array(await rangeFetcher({ fetch: hf, cacheDir: join(ro, 'x') })(0, 10))], [...read(0, 10)]); // not a directory
    chmodSync(join(cacheDir, cached), 0o000);
    assert.deepEqual([...new Uint8Array(await get(100, 200))], [...a]); // unreadable cache file
    chmodSync(join(cacheDir, cached), 0o644);
    assert.deepEqual([...new Uint8Array(await rangeFetcher({ fetch: hf, cache: false })(5, 9))], [...read(5, 9)]);
    const plain = (async () => new Response(read(0, 64), { status: 200 })) as typeof fetch;
    assert.equal((await rangeFetcher({ fetch: plain, cache: false })(0, 16)).byteLength, 16); // server ignored Range at 0: slice
    await assert.rejects(rangeFetcher({ fetch: plain, cache: false })(10, 16), /HTTP 200/);
    await assert.rejects(rangeFetcher({ fetch: (async () => new Response('', { status: 404 })) as typeof fetch, cache: false })(0, 1), /HTTP 404/);
    const realFetch = globalThis.fetch, realHome = process.env.HOME, realEnvCache = process.env.BADECISION_CACHE;
    globalThis.fetch = hf; // defaults: global fetch, $BADECISION_CACHE, then ~/.cache/badecision
    try {
      process.env.BADECISION_CACHE = join(cacheDir, 'env');
      assert.equal((await rangeFetcher({})(0, 4)).byteLength, 4);
      assert.ok(existsSync(join(cacheDir, 'env')));
      delete process.env.BADECISION_CACHE;
      process.env.HOME = join(cacheDir, 'home');
      assert.equal((await rangeFetcher({})(0, 4)).byteLength, 4);
      assert.ok(existsSync(join(cacheDir, 'home/.cache/badecision')));
    } finally {
      globalThis.fetch = realFetch;
      if (realHome === undefined) delete process.env.HOME; else process.env.HOME = realHome;
      if (realEnvCache !== undefined) process.env.BADECISION_CACHE = realEnvCache;
    }
    const proc = process as unknown as { getBuiltinModule?: unknown };
    const realBuiltin = proc.getBuiltinModule;
    proc.getBuiltinModule = undefined; // a browser: Cache API, then nothing at all
    try {
      const store = new Map<string, ArrayBuffer>();
      const g = globalThis as { caches?: unknown };
      g.caches = { open: async () => ({ match: async (k: string) => (store.has(k) ? new Response(store.get(k)) : undefined), put: async (k: string, r: Response) => { store.set(k, await r.arrayBuffer()); } }) };
      const web = rangeFetcher({ fetch: hf });
      assert.deepEqual([...new Uint8Array(await web(0, 32))], [...read(0, 32)]);
      requests = 0;
      assert.deepEqual([...new Uint8Array(await web(0, 32))], [...read(0, 32)]);
      assert.equal(requests, 0);
      g.caches = { open: async () => ({ match: async () => undefined, put: async () => { throw new Error('QuotaExceededError'); } }) };
      assert.equal((await rangeFetcher({ fetch: hf })(0, 8)).byteLength, 8); // full cache: still answers
      g.caches = { open: async () => { throw new Error('SecurityError'); } };
      assert.equal((await rangeFetcher({ fetch: hf })(0, 8)).byteLength, 8);
      delete g.caches;
      assert.equal((await rangeFetcher({ fetch: hf })(0, 8)).byteLength, 8);
    } finally {
      proc.getBuiltinModule = realBuiltin;
    }

    // loading: a failed load can be retried; progress is reported; parallel calls share one load
    await assert.rejects(bd.seriously.load({ fetch: (async () => new Response('', { status: 503 })) as typeof fetch, cache: false }), /HTTP 503/);
    const progress: number[] = [];
    const [info, again] = await Promise.all([bd.seriously.load({ fetch: hf, cacheDir, onProgress: (d) => progress.push(d) }), bd.seriously.load()]);
    assert.equal(info, again);
    assert.equal(info.layers, 20);
    assert.ok(info.bytes > 150e6 && info.bytes < 170e6 && progress.at(-1) === info.bytes);
    assert.ok(info.test.accuracy >= 0.9);

    // the answers: knowledge, uncertainty, omens and dates, Opposite Day; every async twin of the sync API
    const s = bd.seriously.create({ sign: 'Leo', date: day(2026, 9, 30) }); // a Friday
    assert.equal(await s.isItTrue('Is Paris in France?'), 'true');
    assert.equal(await s.isIt('Sharks are mammals'), 'false');
    assert.equal(await s.isItTrue('Sharks are mammals'), false);
    assert.equal(await s.isItTrue('My neighbour owns 14 spoons'), null);
    const plainDecision = await s.decide('Is Paris in France?');
    assert.deepEqual(Object.keys(plainDecision), ['question', 'verdict', 'answer', 'confidence']);
    const nerd = await s.decide('Is it a good day to deploy?', true);
    assert.equal(nerd.engine, 'serious');
    assert.equal(nerd.date, '2026-10-30');
    assert.ok(Math.abs(Object.values(nerd.probs).reduce((x, y) => x + y, 0) - 1) < 1e-6);
    assert.equal(await s.isItTrueStrict('Is Paris in France?'), 'true');
    await assert.rejects(s.isItTrueStrict('Sharks are mammals'), (e: unknown) => e instanceof BadDecisionError && e.result === 'false');
    assert.equal(await s.isItFalse('Sharks are mammals'), true);
    assert.equal(await s.isItFalse('Is Paris in France?'), false);
    s.configure({ random: () => 0 });
    assert.equal(typeof await s.isItFalse('Will it rain tomorrow?'), 'boolean'); // a maybe, settled by the coin
    assert.equal(await s.isItTrulyTrue('Is Paris in France?'), false);
    assert.equal(typeof await s.feelingLucky('this condition is true'), 'boolean');
    s.configure({ date: day(2027, 0, 25) });
    assert.equal(await s.isIt('Is Paris in France?'), 'false', 'January 25 is Opposite Day');
    assert.ok(['true', false, null].includes(await bd.seriously.isItTrue('Fire is hot'))); // the default instance
    const long = await s.decide('really '.repeat(400) + 'long?'); // longer than the context: truncated, still answers
    assert.ok(long.confidence > 0);
    assert.ok((await s.decide('?? why', true)).probs); // tokens merging into the cached prefix: full prompt path
  } finally {
    rmSync(cacheDir, { recursive: true, force: true });
  }
});
