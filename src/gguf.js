// Minimal GGUF reader: metadata + tensor directory from the start of a (possibly partial) file. Enough to find the
// byte ranges of the tensors we need, so only those get downloaded (HTTP Range).

const TYPE_SIZE = { 0: [1, 4], 1: [1, 2], 2: [32, 18], 3: [32, 20], 8: [32, 34] }; // ggml type -> [block, bytes]: F32 F16 Q4_0 Q4_1 Q8_0

export class NeedMoreBytes extends Error {
  constructor(n) { super(`GGUF header needs more than ${n} bytes`); this.need = n * 2; }
}

/** Bytes a tensor of `n` elements of ggml `type` occupies. */
export function tensorBytes(type, n) {
  const s = TYPE_SIZE[type];
  if (!s) throw new Error(`Unsupported GGUF tensor type ${type}`);
  return (n / s[0]) * s[1];
}

/**
 * Parse the header. `buf` is an ArrayBuffer holding at least the header (throws NeedMoreBytes otherwise).
 * Returns { meta, tensors: [{ name, dims, type, offset, bytes }] (offset absolute in the file), dataStart }.
 */
export function parseGGUF(buf) {
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  const td = new TextDecoder();
  let p = 0;
  const need = (n) => { if (p + n > buf.byteLength) throw new NeedMoreBytes(buf.byteLength); };
  const u32 = () => { need(4); const v = dv.getUint32(p, true); p += 4; return v; };
  const u64 = () => { need(8); const v = Number(dv.getBigUint64(p, true)); p += 8; return v; };
  const str = () => { const n = u64(); need(n); const s = td.decode(u8.subarray(p, p + n)); p += n; return s; };
  const scalar = {
    0: () => { need(1); return dv.getUint8(p++); }, 1: () => { need(1); return dv.getInt8(p++); },
    2: () => { need(2); const v = dv.getUint16(p, true); p += 2; return v; }, 3: () => { need(2); const v = dv.getInt16(p, true); p += 2; return v; },
    4: u32, 5: () => { need(4); const v = dv.getInt32(p, true); p += 4; return v; },
    6: () => { need(4); const v = dv.getFloat32(p, true); p += 4; return v; }, 7: () => { need(1); return dv.getUint8(p++) !== 0; },
    8: str, 10: u64, 11: () => { need(8); const v = Number(dv.getBigInt64(p, true)); p += 8; return v; },
    12: () => { need(8); const v = dv.getFloat64(p, true); p += 8; return v; },
  };
  const value = (t) => {
    if (t === 9) {
      const et = u32(), n = u64(), out = new Array(n);
      for (let i = 0; i < n; i++) out[i] = value(et);
      return out;
    }
    if (!scalar[t]) throw new Error(`Unsupported GGUF value type ${t}`);
    return scalar[t]();
  };

  if (u32() !== 0x46554747) throw new Error('Not a GGUF file');
  const version = u32();
  if (version < 2) throw new Error(`GGUF version ${version} is not supported`);
  const nTensors = u64(), nKV = u64();
  const meta = {};
  for (let i = 0; i < nKV; i++) { const k = str(); meta[k] = value(u32()); }
  const tensors = [];
  for (let i = 0; i < nTensors; i++) {
    const name = str(), nd = u32(), dims = [];
    for (let d = 0; d < nd; d++) dims.push(u64());
    const type = u32(), offset = u64();
    tensors.push({ name, dims, type, offset, bytes: tensorBytes(type, dims.reduce((a, b) => a * b, 1)) });
  }
  const align = meta['general.alignment'] ?? 32;
  const dataStart = Math.ceil(p / align) * align;
  for (const t of tensors) t.offset += dataStart;
  return { meta, tensors, dataStart };
}
