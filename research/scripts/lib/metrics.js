// Shared evaluation helpers: accuracy, per-class precision/recall, confusion matrix, calibration (ECE).
import { LABELS } from '../../../packages/core/src/features.js';

/** model: anything with predict(text) -> {yes,no,maybe,unsure}; rows: [{text,label}] */
export function evaluate(model, rows, predictOpts) {
  const K = LABELS.length;
  const conf = Array.from({ length: K }, () => new Array(K).fill(0));
  const bins = Array.from({ length: 10 }, () => ({ n: 0, conf: 0, correct: 0 }));
  const mistakes = [];
  let correct = 0;
  for (const r of rows) {
    const p = model.predict(r.text, predictOpts);
    const probs = LABELS.map((l) => p[l]);
    const pred = probs.indexOf(Math.max(...probs));
    const gold = LABELS.indexOf(r.label);
    conf[gold][pred]++;
    const ok = pred === gold;
    if (ok) correct++; else mistakes.push({ text: r.text, gold: r.label, pred: LABELS[pred], p: +probs[pred].toFixed(2) });
    const bin = bins[Math.min(9, Math.floor(probs[pred] * 10))];
    bin.n++; bin.conf += probs[pred]; bin.correct += ok;
  }
  const ece = bins.reduce((a, x) => a + (x.n ? (x.n / rows.length) * Math.abs(x.conf / x.n - x.correct / x.n) : 0), 0);
  const perClass = LABELS.map((l, k) => {
    const tp = conf[k][k], fp = conf.reduce((a, row, i) => a + (i !== k ? row[k] : 0), 0), fn = conf[k].reduce((a, x, i) => a + (i !== k ? x : 0), 0);
    return { label: l, precision: tp / (tp + fp || 1), recall: tp / (tp + fn || 1), n: tp + fn };
  });
  return { accuracy: correct / rows.length, ece, confusion: conf, perClass, mistakes, n: rows.length };
}

export function formatReport(rep, { showMistakes = 12 } = {}) {
  const pct = (x) => (x * 100).toFixed(1).padStart(5) + '%';
  const lines = [];
  lines.push(`accuracy ${pct(rep.accuracy)}   ECE ${rep.ece.toFixed(3)}   n=${rep.n}`);
  lines.push('class    precision  recall   n');
  for (const c of rep.perClass) lines.push(`${c.label.padEnd(8)} ${pct(c.precision)}    ${pct(c.recall)}  ${c.n}`);
  lines.push('confusion (rows = gold, cols = predicted):');
  lines.push('         ' + LABELS.map((l) => l.padStart(7)).join(''));
  rep.confusion.forEach((row, i) => lines.push(LABELS[i].padEnd(9) + row.map((x) => String(x).padStart(7)).join('')));
  if (showMistakes && rep.mistakes.length) {
    lines.push(`some mistakes (${rep.mistakes.length} total):`);
    for (const m of rep.mistakes.slice(0, showMistakes)) lines.push(`  [${m.gold} -> ${m.pred} ${m.p}] ${m.text}`);
  }
  return lines.join('\n');
}
