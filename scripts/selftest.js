#!/usr/bin/env node
// Sanity checks that need no network: pnpm test
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from './lib/unsloth.js';
import { createDecider, readStars, applyStars, LABELS } from '../src/bdm.js';
import { sunSign, moonPhase, mercuryRetrograde } from '../src/horoscope.js';
import { fnv1a, extract } from '../src/features.js';

let n = 0;
const t = async (name, fn) => { await fn(); n++; console.log('✔', name); };

await t('fnv1a is stable', () => assert.equal(fnv1a('w:fire'), fnv1a('w:fire')) || assert.equal(typeof fnv1a('x'), 'number'));
await t('negation creates negated features', () => assert.ok(extract('Fire is not hot').includes('nw:hot')));

const bdm = await createDecider();
await t('model loads and probabilities sum to 1', () => {
  const r = bdm.decide('Fire is hot', { astro: 0 });
  assert.ok(Math.abs(LABELS.reduce((a, l) => a + r.probs[l], 0) - 1) < 1e-6);
});
await t('deterministic', () => assert.deepEqual(bdm.decide('Should I buy a boat?', { date: '2026-10-30' }).probs, bdm.decide('Should I buy a boat?', { date: '2026-10-30' }).probs));
await t('sanity predictions', () => {
  const v = (s) => bdm.decide(s, { astro: 0 }).verdict;
  assert.equal(v('Fire is hot'), 'yes');
  assert.equal(v('Fire is cold'), 'no');
  assert.equal(v('It will rain tomorrow'), 'maybe');
  assert.equal(v('The zorblax is flumpy'), 'unsure');
});
await t('zodiac signs', () => {
  assert.equal(sunSign('1990-08-01').name, 'Leo');
  assert.equal(sunSign('1990-12-25').name, 'Capricorn');
  assert.equal(sunSign('1990-01-10').name, 'Capricorn');
  assert.equal(sunSign('1990-03-21').name, 'Aries');
  assert.equal(sunSign('1990-03-20').name, 'Pisces');
});
await t('moon + mercury', () => {
  assert.equal(moonPhase('2026-12-24T12:00:00Z').name, 'Full Moon');
  assert.equal(mercuryRetrograde('2026-10-30').retrograde, true);
  assert.equal(mercuryRetrograde('2026-12-01').retrograde, false);
});
await t('astro strength 0 is a no-op, >0 changes things', () => {
  const p = { yes: 0.4, no: 0.3, maybe: 0.2, unsure: 0.1 };
  const s = readStars({ date: '2026-10-30', birthday: '1990-08-01' });
  assert.deepEqual(applyStars(p, s, 0), p);
  assert.notDeepEqual(applyStars(p, s, 1), p);
});

// end-to-end API pipeline against the mock server
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
