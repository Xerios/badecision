// Feature extraction shared by training (Node) and inference (Node + browser).
// fastText-style: hashed word unigrams, word bigrams, char n-grams and a few flags.
// Any change here changes the model's input space -> retrain after editing.

export const LABELS = ['yes', 'no', 'maybe', 'unsure'];

// FNV-1a 32-bit over UTF-16 code units (deterministic, identical in every JS runtime).
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// words, keeping "?" and "!" as tokens and splitting contractions like "isn't" -> "is", "n't"
export function tokenize(text) {
  const t = normalize(text)
    .replace(/n't\b/g, " n't")
    .replace(/([?!])/g, ' $1 ');
  return t.match(/n't|[\p{L}\p{N}]+(?:'[\p{L}]+)?|[?!]/gu) ?? [];
}

const NEGATIONS = new Set(['not', "n't", 'no', 'never', 'cannot', 'nothing', 'none', 'nobody', 'neither', 'nor']);

/**
 * Returns the list of feature strings for a sentence (before hashing).
 * Exposed for debugging: `extract("Fire is hot")`.
 */
export const DEFAULT_FEATURES = { char: [3, 3], trigrams: false };

export function extract(text, cfg = DEFAULT_FEATURES) {
  const toks = tokenize(text);
  const feats = [];
  let negated = false;
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i];
    if (NEGATIONS.has(w)) negated = !negated;
    feats.push('w:' + w);
    // words after a negation get a "negated" twin feature so "not cold" != "cold"
    if (negated && !NEGATIONS.has(w)) feats.push('nw:' + w);
    if (i > 0) feats.push('b:' + toks[i - 1] + '_' + w);
    if (cfg.trigrams && i > 1) feats.push('t:' + toks[i - 2] + '_' + toks[i - 1] + '_' + w);
    // char n-grams help with unseen / made-up words ("flurbix")
    if (cfg.char && w.length > 2) {
      const p = '<' + w + '>';
      for (let n = cfg.char[0]; n <= cfg.char[1]; n++) {
        for (let j = 0; j + n <= p.length; j++) feats.push('c' + n + ':' + p.slice(j, j + n));
      }
    }
  }
  // sentence-level flags
  if (toks.length) {
    feats.push('first:' + toks[0]);
    feats.push('len:' + Math.min(6, Math.floor(toks.length / 3)));
  }
  if (toks.includes('?')) feats.push('flag:question');
  if (negated) feats.push('flag:odd_negations');
  if (/\d/.test(text)) feats.push('flag:digit');
  const vowelless = toks.filter((w) => w.length > 3 && !/[aeiouy]/.test(w)).length;
  if (vowelless) feats.push('flag:gibberish');
  return feats;
}

/** Hash features into bucket indices. */
export function featurize(text, buckets, cfg = DEFAULT_FEATURES) {
  const feats = extract(text, cfg);
  const ids = new Int32Array(feats.length);
  for (let i = 0; i < feats.length; i++) ids[i] = fnv1a(feats[i]) % buckets;
  return ids;
}
