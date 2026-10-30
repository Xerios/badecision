#!/usr/bin/env node
// Trains the tiny model in plain JS (no deps, CPU, a few seconds to minutes).
//
//   node scripts/train-tiny.js                                  # seed data only
//   node scripts/train-tiny.js --data data/seed.train.jsonl,data/teacher.jsonl
//   node scripts/train-tiny.js --buckets 32768 --dim 32 --hidden 64 --act relu|tanh|sq --char 3-4|none --trigrams true
//
// Input rows: {"text": "...", "probs": [yes,no,maybe,unsure]}  or  {"text": "...", "label": "yes"}
// Output: models/tiny/model.bin (+ model.json with header/metrics for humans)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LABELS, featurize } from '../src/features.js';
import { serialize, TinyModel } from '../src/model.js';
import { evaluate, formatReport } from './lib/metrics.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') ? [...a, [x.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? 'true' : all[i + 1]]] : a), []));
const opt = {
  data: (args.data ?? 'data/seed.train.jsonl').split(','),
  val: args.val ?? 'data/seed.val.jsonl',
  test: args.test ?? 'data/test.jsonl',
  out: args.out ?? 'models/tiny',
  buckets: +(args.buckets ?? 16384),
  dim: +(args.dim ?? 16),
  hidden: +(args.hidden ?? 32),
  epochs: +(args.epochs ?? 60),
  lr: +(args.lr ?? 0.1),
  dropout: +(args.dropout ?? 0.1),
  seed: +(args.seed ?? 2),
  act: args.act ?? 'relu',
  select: args.select ?? 'acc', // which val metric picks the best epoch: acc | loss | last
  features: { char: args.char === 'none' ? false : (args.char ?? '3-3').split('-').map(Number), trigrams: args.trigrams === 'true' },
};

// ---------- data ----------
const ONE_HOT_SMOOTH = 0.06;
function readRows(file) {
  return readFileSync(join(ROOT, file), 'utf8').split('\n').filter(Boolean).map((l) => {
    const r = JSON.parse(l);
    let t = r.probs;
    if (!t) { const k = LABELS.indexOf(r.label); t = LABELS.map((_, i) => (i === k ? 1 - ONE_HOT_SMOOTH : ONE_HOT_SMOOTH / 3)); }
    const s = t.reduce((a, x) => a + x, 0);
    return { text: r.text, t: t.map((x) => x / s), w: r.weight ?? 1 };
  });
}
const train = opt.data.flatMap(readRows);
const val = readRows(opt.val);
const test = readRows(opt.test);

// class balancing on argmax label
const counts = [0, 0, 0, 0];
for (const r of train) counts[argmax(r.t)]++;
const cw = counts.map((n) => (n ? train.length / (4 * n) : 0)).map((w) => Math.min(3, Math.max(0.5, w)));
for (const r of train) r.w *= cw[argmax(r.t)];

// pre-featurize
for (const r of [...train, ...val]) r.ids = featurize(r.text, opt.buckets, opt.features);

// ---------- params ----------
let s = opt.seed;
const rnd = () => { s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9) | 0; return ((s >>> 0) % 1e9) / 1e9; };
const { buckets: B, dim: D, hidden: H } = opt, K = LABELS.length;
const ACT = { tanh: [Math.tanh, (z, h) => 1 - h * h], relu: [(z) => (z > 0 ? z : 0.01 * z), (z) => (z > 0 ? 1 : 0.01)], sq: [(z) => z * z, (z) => 2 * z] }[opt.act];
const E = new Float32Array(B * D).map(() => (rnd() * 2 - 1) / D);
const U = new Float32Array(H * D).map(() => (rnd() * 2 - 1) * Math.sqrt(6 / (H + D)));
const c = new Float32Array(H);
const W = new Float32Array(K * H).map(() => (rnd() * 2 - 1) * Math.sqrt(6 / (K + H)));
const b = new Float32Array(K);
// adagrad accumulators
const gE = new Float32Array(B * D).fill(1e-6), gU = new Float32Array(H * D).fill(1e-6), gc = new Float32Array(H).fill(1e-6), gW = new Float32Array(K * H).fill(1e-6), gb = new Float32Array(K).fill(1e-6);

function forward(ids, E_) {
  const v = new Float32Array(D);
  for (const id of ids) { const o = id * D; for (let d = 0; d < D; d++) v[d] += E_[o + d]; }
  if (ids.length) for (let d = 0; d < D; d++) v[d] /= ids.length;
  const h = new Float32Array(H);
  const zz = new Float32Array(H);
  for (let j = 0; j < H; j++) { let z = c[j]; for (let d = 0; d < D; d++) z += U[j * D + d] * v[d]; zz[j] = z; h[j] = ACT[0](z); }
  const z = new Float32Array(K);
  for (let k = 0; k < K; k++) { let a = b[k]; for (let j = 0; j < H; j++) a += W[k * H + j] * h[j]; z[k] = a; }
  return { v, h, zz, z, p: softmaxArr(z) };
}

function step(r, lr) {
  let ids = r.ids;
  if (opt.dropout > 0) { const kept = ids.filter(() => rnd() >= opt.dropout); if (kept.length) ids = kept; }
  const { v, h, zz, p } = forward(ids, E);
  const gz = new Float32Array(K);
  let loss = 0;
  for (let k = 0; k < K; k++) { gz[k] = r.w * (p[k] - r.t[k]); loss -= r.t[k] * Math.log(p[k] + 1e-9); }
  const gh = new Float32Array(H);
  for (let k = 0; k < K; k++) {
    for (let j = 0; j < H; j++) { const g = gz[k] * h[j]; gh[j] += W[k * H + j] * gz[k]; const i = k * H + j; gW[i] += g * g; W[i] -= (lr * g) / Math.sqrt(gW[i]); }
    gb[k] += gz[k] * gz[k]; b[k] -= (lr * gz[k]) / Math.sqrt(gb[k]);
  }
  const gv = new Float32Array(D);
  for (let j = 0; j < H; j++) {
    const ga = gh[j] * ACT[1](zz[j], h[j]);
    for (let d = 0; d < D; d++) { const i = j * D + d; gv[d] += U[i] * ga; const g = ga * v[d]; gU[i] += g * g; U[i] -= (lr * g) / Math.sqrt(gU[i]); }
    gc[j] += ga * ga; c[j] -= (lr * ga) / Math.sqrt(gc[j]);
  }
  const inv = 1 / ids.length;
  for (const id of ids) {
    const o = id * D;
    for (let d = 0; d < D; d++) { const g = gv[d] * inv, i = o + d; gE[i] += g * g; E[i] -= (lr * g) / Math.sqrt(gE[i]); }
  }
  return loss * r.w;
}

function valLoss(rows, E_ = E) {
  let loss = 0, acc = 0;
  for (const r of rows) { const { p } = forward(r.ids, E_); for (let k = 0; k < K; k++) loss -= r.t[k] * Math.log(p[k] + 1e-9); if (argmax(p) === argmax(r.t)) acc++; }
  return { loss: loss / rows.length, acc: acc / rows.length };
}

// ---------- train ----------
console.log(`train ${train.length} rows | val ${val.length} | test ${test.length} | class counts ${JSON.stringify(Object.fromEntries(LABELS.map((l, i) => [l, counts[i]])))}`);
console.log(`model: buckets=${B} dim=${D} hidden=${H} -> ~${((B * (D + 4) + (H * D + H + K * H + K) * 4) / 1024).toFixed(0)} KB int8`);
let best = { loss: Infinity }, snapshot = null;
const t0 = Date.now();
for (let ep = 1; ep <= opt.epochs; ep++) {
  for (let i = train.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [train[i], train[j]] = [train[j], train[i]]; }
  const lr = opt.lr * (1 - (ep - 1) / opt.epochs * 0.7);
  let tl = 0;
  for (const r of train) tl += step(r, lr);
  const vl = valLoss(val);
  const better = opt.select === 'last' ? true : opt.select === 'loss' ? vl.loss < best.loss : (best.acc === undefined || vl.acc >= best.acc);
  const mark = better ? ' *' : '';
  if (better) { best = { ...vl, ep }; snapshot = { E: E.slice(), U: U.slice(), c: c.slice(), W: W.slice(), b: b.slice() }; }
  console.log(`epoch ${String(ep).padStart(2)}  train ${(tl / train.length).toFixed(4)}  val ${vl.loss.toFixed(4)}  val-acc ${(vl.acc * 100).toFixed(1)}%${mark}`);
}
console.log(`best epoch ${best.ep} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
E.set(snapshot.E); U.set(snapshot.U); c.set(snapshot.c); W.set(snapshot.W); b.set(snapshot.b);

// ---------- quantize E to int8 per row ----------
const rowScale = new Float32Array(B), Eq = new Int8Array(B * D);
for (let r = 0; r < B; r++) {
  let m = 0; for (let d = 0; d < D; d++) m = Math.max(m, Math.abs(E[r * D + d]));
  // rows never touched by training still hold their random init; zero them so they act as "unknown"
  if (gE[r * D] <= 1e-6 + 1e-12) continue;
  rowScale[r] = m / 127;
  if (m > 0) for (let d = 0; d < D; d++) Eq[r * D + d] = Math.round(E[r * D + d] / rowScale[r]);
}

// ---------- temperature calibration on val (quantized model) ----------
const header = { format: 'BDM1', version: 1, labels: LABELS, buckets: B, dim: D, hidden: H, activation: opt.act, features: opt.features, temperature: 1, featuresVersion: 1, createdAt: new Date().toISOString(), trainedOn: opt.data };
let model = TinyModel.fromArrayBuffer(serialize(header, { rowScale, E: Eq, U, c, W, b }));
const valLogits = val.map((r) => model.logits(r.text));
let bestT = 1, bestNll = Infinity;
for (let T = 0.4; T <= 3.01; T += 0.05) {
  let nll = 0;
  val.forEach((r, i) => { const p = softmaxArr(valLogits[i], T); for (let k = 0; k < K; k++) nll -= r.t[k] * Math.log(p[k] + 1e-9); });
  if (nll < bestNll) { bestNll = nll; bestT = +T.toFixed(2); }
}
header.temperature = bestT;
const buf = serialize(header, { rowScale, E: Eq, U, c, W, b });
model = TinyModel.fromArrayBuffer(buf);

// ---------- report ----------
const valRep = evaluate(model, val.map((r) => ({ text: r.text, label: LABELS[argmax(r.t)] })));
const testRep = evaluate(model, test.map((r) => ({ text: r.text, label: LABELS[argmax(r.t)] })));
header.metrics = { valAcc: valRep.accuracy, testAcc: testRep.accuracy, testEce: testRep.ece, floatValAcc: best.acc };
console.log(`\ncalibrated temperature: ${bestT}`);
console.log(`val  (template-like, quantized): ${(valRep.accuracy * 100).toFixed(1)}%   (float: ${(best.acc * 100).toFixed(1)}%)`);
console.log('\nTEST (handwritten by a human AI, never seen):');
console.log(formatReport(testRep));

const outDir = join(ROOT, opt.out);
mkdirSync(outDir, { recursive: true });
const finalBuf = serialize(header, { rowScale, E: Eq, U, c, W, b });
writeFileSync(join(outDir, 'model.bin'), Buffer.from(finalBuf));
writeFileSync(join(outDir, 'model.json'), JSON.stringify(header, null, 2) + '\n');
console.log(`\nwrote ${opt.out}/model.bin (${(finalBuf.byteLength / 1024).toFixed(0)} KB)`);

function argmax(a) { let m = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[m]) m = i; return m; }
function softmaxArr(z, T = 1) { let m = -Infinity; for (const x of z) m = Math.max(m, x / T); const e = Array.from(z, (x) => Math.exp(x / T - m)); const s_ = e.reduce((a, x) => a + x, 0); return e.map((x) => x / s_); }
