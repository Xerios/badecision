#!/usr/bin/env node
// Zero-dependency static server for the demo (ES modules need http://, not file://).
//   node scripts/serve.js [--port 5173]   ->  http://localhost:5173/web/
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { argFlags, ROOT } from './lib/unsloth.js';

const port = +(argFlags().port ?? 5173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.bin': 'application/octet-stream', '.css': 'text/css', '.gguf': 'application/octet-stream', '.wasm': 'application/wasm' };

createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  if (p === '/' ) { res.writeHead(302, { Location: '/web/' }); return res.end(); }
  let file = join(ROOT, p);
  if (!file.startsWith(ROOT) || /[/\\]\.env/.test(file)) { res.writeHead(403); return res.end(); }
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(port, () => console.log(`demo: http://localhost:${port}/web/`));
