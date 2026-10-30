#!/usr/bin/env node
// Research tooling checks, no network: the Unsloth pipeline against the mock Studio. (The core has its own selftest.)
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from './lib/unsloth.js';

let n = 0;
const t = async (name, fn) => { await fn(); n++; console.log('✔', name); };

await t('unsloth pipeline against mock server', async () => {
  const port = 8800 + Math.floor(Math.random() * 90);
  const mock = spawn(process.execPath, [join(ROOT, 'scripts/mock-unsloth.js'), '--port', String(port)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 700));
  try {
    const { client } = await import('./lib/unsloth.js');
    const { makeJudge } = await import('./lib/teacher.js');
    const api = client({ baseUrl: `http://localhost:${port}`, apiKey: 'sk-unsloth-mock' });
    const judge = makeJudge(api);
    const r = await judge('Fire is hot');
    assert.equal(r.method, 'logprobs');
    assert.ok(Math.abs(Object.values(r.probs).reduce((a, x) => a + x, 0) - 1) < 1e-6);
    const j = await makeJudge(api, { mode: 'json' })('Fire is hot');
    assert.equal(j.method, 'json');
  } finally { mock.kill(); }
});
console.log(`\n${n} checks passed`);
