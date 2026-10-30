// Model loading, kept apart from the runtime (model.js) so bundles that inline the weights never see `node:fs`.

import { TinyModel } from './model.js';

/** Load from a URL (browser / Node fetch) or a filesystem path (Node). */
export async function loadModel(src) {
  const isUrl = typeof src === 'string' ? /^(https?:|blob:|data:)/.test(src) || typeof window !== 'undefined' : src instanceof URL && src.protocol !== 'file:';
  if (isUrl) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to load model: ${res.status} ${src}`);
    return TinyModel.fromArrayBuffer(await res.arrayBuffer());
  }
  const { readFile } = await import('node:fs/promises');
  const b = await readFile(src);
  return TinyModel.fromArrayBuffer(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
