// Minimal client for the Unsloth Studio API (OpenAI-compatible). Reads UNSLOTH_BASEURL / UNSLOTH_API_KEY
// from the environment or from ../../.env (format "KEY = value", quotes optional).
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadEnv(file = join(ROOT, '.env')) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

export function client({ baseUrl, apiKey, timeoutMs = 120000, retries = 3 } = {}) {
  loadEnv();
  baseUrl = (baseUrl ?? process.env.UNSLOTH_BASEURL ?? 'http://localhost:8888').replace(/\/+$/, '');
  apiKey = apiKey ?? process.env.UNSLOTH_API_KEY;
  if (!apiKey) throw new Error('UNSLOTH_API_KEY missing (put it in .env)');

  async function request(method, path, body) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(baseUrl + path, {
          method,
          headers: { Authorization: `Bearer ${apiKey}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(timeoutMs),
        });
        const text = await res.text();
        let json; try { json = JSON.parse(text); } catch { json = undefined; }
        if (!res.ok) {
          const err = new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
          err.status = res.status; err.body = json ?? text;
          if (res.status >= 400 && res.status < 500 && res.status !== 429) throw err; // don't retry client errors
          lastErr = err;
        } else return json ?? text;
      } catch (e) {
        if (e.status && e.status < 500 && e.status !== 429) throw e;
        lastErr = e;
      }
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
    throw lastErr;
  }

  return {
    baseUrl,
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b),
    models: () => request('GET', '/v1/models'),
    chat: (body) => request('POST', '/v1/chat/completions', { stream: false, ...body }),
    completions: (body) => request('POST', '/v1/completions', { stream: false, ...body }),
  };
}

/** Run async fn over items with limited concurrency, preserving order. */
export async function mapLimit(items, limit, fn, onProgress) {
  const out = new Array(items.length);
  let i = 0, done = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
      done++;
      // throttle progress output: every item on a TTY, every ~5% otherwise (logs stay readable)
      if (onProgress && (process.stdout.isTTY || done === items.length || done % Math.max(1, Math.round(items.length / 20)) === 0)) onProgress(done, items.length);
    }
  }));
  return out;
}

/** Strip <think> blocks and code fences, then parse the first JSON value found. */
export function parseJsonLoose(text) {
  const t = String(text).replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/g, '').trim();
  const start = t.search(/[[{]/);
  if (start < 0) throw new Error('no JSON in: ' + t.slice(0, 120));
  for (let end = t.length; end > start; end--) {
    try { return JSON.parse(t.slice(start, end)); } catch { /* shrink */ }
  }
  throw new Error('unparseable JSON: ' + t.slice(0, 120));
}

export const argFlags = (argv = process.argv.slice(2)) => Object.fromEntries(argv.reduce((a, x, i, all) => (x.startsWith('--') ? [...a, [x.slice(2), all[i + 1] === undefined || all[i + 1].startsWith('--') ? 'true' : all[i + 1]]] : a), []));
