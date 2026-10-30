#!/usr/bin/env node
// Sanity checks for the shared core, no network: pnpm test
import assert from 'node:assert/strict';
import { createDecider, readStars, applyStars, LABELS } from '../src/bdm.js';
import { sunSign, moonPhase, mercuryRetrograde, isOppositeDay } from '../src/horoscope.js';
import { numbersIn, matchTopics, parseOmens, applyOmens, dailyOmens, decisionState } from '../src/omens.js';
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

await t('omens: numbers, topics, parsing', () => {
  assert.deepEqual(numbersIn('two hundred and five, 1,000 and twenty one').numbers.sort((a, b) => a - b), [21, 205, 1000]);
  assert.deepEqual(numbersIn('I have one cat').numbers, []);
  assert.ok(matchTopics('Should I buy the scarlet car?').includes('red'));
  assert.ok(matchTopics('Should I bet 5000 euros?').includes('large numbers'));
  assert.ok(!matchTopics('Should I buy the blue car?').includes('red'));
  assert.deepEqual(parseOmens('Avoid red today. Large numbers bring misfortune. Travel is favoured.').map((o) => `${o.kind}:${o.topic}`), ['avoid:red', 'avoid:large numbers', 'favour:travel']);
  assert.deepEqual(dailyOmens('x|2026-01-01'), dailyOmens('x|2026-01-01'));
  assert.equal(decisionState('Fire is hot'), 'Horoscope: none\nQuestion: Fire is hot');
});

await t('omens move matching answers only', () => {
  const p = { yes: 0.2, no: 0.2, maybe: 0.5, unsure: 0.1 };
  const avoid = [{ kind: 'avoid', topic: 'red', text: 'Avoid red.' }];
  const red = applyOmens(p, 'Should I buy the red car?', avoid).probs;
  assert.ok(red.no > 0.5, 'avoid red -> no');
  assert.deepEqual(applyOmens(p, 'Should I buy the blue car?', avoid).probs, p);
  assert.ok(applyOmens(p, 'Should I avoid red shoes?', avoid).probs.yes > 0.5, 'negated question flips the omen');
});

await t('omens: today means the actual weekday and month', () => {
  const fri = new Date(2026, 9, 30, 12), mon = new Date(2026, 10, 2, 12);
  const t = matchTopics('Is it a good day to deploy?', fri);
  assert.ok(t.includes('Fridays') && t.includes('October') && t.includes('technology'));
  assert.ok(matchTopics('Should we ship tomorrow?', fri).includes('Saturdays'));
  assert.ok(!matchTopics('May I go out?').includes('May'));
  const never = parseOmens('Never deploy on Fridays.');
  assert.deepEqual(never.map((o) => `${o.kind}:${o.topic}`), ['avoid:Fridays']);
  const p = { yes: 0.25, no: 0.15, maybe: 0.45, unsure: 0.15 };
  assert.ok(applyOmens(p, 'Is it a good day to deploy?', never, 1, fri).probs.no > 0.5);
  assert.equal(applyOmens(p, 'Is it a good day to deploy?', never, 1, mon).hits.length, 0);
  assert.equal(decisionState('x', [], fri), 'Today: Friday in October\nHoroscope: none\nQuestion: x');
});

await t('opposite day swaps yes and no', async () => {
  assert.ok(isOppositeDay(new Date(2027, 0, 25)) && !isOppositeDay(new Date(2027, 0, 26)));
  const bdm = await createDecider();
  const a = bdm.decide('Fire is hot', { astro: 0, date: new Date(2027, 0, 26) });
  const b = bdm.decide('Fire is hot', { astro: 0, date: new Date(2027, 0, 25) });
  assert.equal(b.probs.no, a.probs.yes);
  assert.equal(bdm.decide('Fire is hot', { astro: 0, date: new Date(2027, 0, 25), oppositeDay: false }).verdict, a.verdict);
});
console.log(`\n${n} checks passed`);
