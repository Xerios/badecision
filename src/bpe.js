// Byte-level BPE (GPT-2 style), built from a GGUF vocabulary. Matches Hugging Face `tokenizers` for SmolLM2:
// special tokens split out first, then every digit on its own, then the GPT-2 regex, then BPE merges by rank.

const GPT2_SPLIT = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

// GPT-2's reversible byte -> printable character map
function byteMap() {
  const bs = [];
  for (let i = 33; i <= 126; i++) bs.push(i);
  for (let i = 161; i <= 172; i++) bs.push(i);
  for (let i = 174; i <= 255; i++) bs.push(i);
  const cs = bs.slice();
  let n = 0;
  for (let b = 0; b < 256; b++) if (!bs.includes(b)) { bs.push(b); cs.push(256 + n++); }
  const map = new Array(256);
  bs.forEach((b, i) => { map[b] = String.fromCharCode(cs[i]); });
  return map;
}

export class BPETokenizer {
  /**
   * @param {string[]} tokens      tokenizer.ggml.tokens
   * @param {string[]} merges      tokenizer.ggml.merges ("a b")
   * @param {number[]} [types]     tokenizer.ggml.token_type (3 = control, 4 = user-defined: matched literally)
   */
  constructor(tokens, merges, types = []) {
    this.vocab = new Map(tokens.map((t, i) => [t, i]));
    this.ranks = new Map(merges.map((m, i) => [m, i]));
    this.bytes = byteMap();
    this.enc = new TextEncoder();
    this.cache = new Map();
    const special = tokens.filter((t, i) => types[i] === 3 || types[i] === 4).sort((a, b) => b.length - a.length);
    this.specialRe = special.length ? new RegExp(`(${special.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`) : null;
  }

  bpe(word) {
    const hit = this.cache.get(word);
    if (hit) return hit;
    let parts = Array.from(word);
    while (parts.length > 1) {
      let best = -1, rank = Infinity;
      for (let i = 0; i < parts.length - 1; i++) {
        const r = this.ranks.get(parts[i] + ' ' + parts[i + 1]);
        if (r !== undefined && r < rank) { rank = r; best = i; }
      }
      if (best < 0) break;
      const a = parts[best], b = parts[best + 1], out = [];
      for (let i = 0; i < parts.length; i++) {
        if (i < parts.length - 1 && parts[i] === a && parts[i + 1] === b) { out.push(a + b); i++; } else out.push(parts[i]);
      }
      parts = out;
    }
    const ids = parts.map((p) => {
      const id = this.vocab.get(p);
      if (id === undefined) throw new Error(`BPE produced an unknown piece ${JSON.stringify(p)}`);
      return id;
    });
    if (this.cache.size < 50000) this.cache.set(word, ids);
    return ids;
  }

  encode(text) {
    const ids = [];
    const chunks = this.specialRe ? text.split(this.specialRe) : [text];
    for (let c = 0; c < chunks.length; c++) {
      const chunk = chunks[c];
      if (!chunk) continue;
      if (c % 2 === 1) { ids.push(this.vocab.get(chunk)); continue; } // a special token
      for (const piece of chunk.split(/(\p{Nd})/u)) {                 // Digits(individual_digits)
        if (!piece) continue;
        for (const m of piece.matchAll(GPT2_SPLIT)) {
          let s = '';
          for (const b of this.enc.encode(m[0])) s += this.bytes[b];
          for (const id of this.bpe(s)) ids.push(id);
        }
      }
    }
    return ids;
  }
}
