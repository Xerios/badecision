// Code shown on the page, highlighted with highlight() from src/lib/text.js (the tree and license are shown as-is).

export const example = `import { isIt, isItTrue, decide, feelingLucky,
  configure, create, seriously } from 'badecision';

configure({ birthday: '1990-08-01' });

isIt('Fire is hot');         // 'true'
isIt('Is a whale a fish?');  // 'false'

if (isItTrue('Should we approve the refund?'))
  approveRefund(order);

decide('Should we hire the candidate?');
// { verdict: 'maybe', answer: 'Maybe.', confidence: 0.43 }

if (feelingLucky('the candidate will accept our offer'))
  cancelTheOtherInterviews();

// new in 2.0: for when it matters
await seriously.isIt('Sharks are mammals'); // 'false'

// per-user instances on the server
const bd = create({ birthday: req.user.birthday });`

export const test = `test('it works', () => {
  checkWasmJsParity(questions); // 100, handwritten by a human AI
  checkReferenceAgreement();
  checkEveryHelper();
  checkFactory();
  checkLuckyNumbers({ fullMoon: true, retrograde: true });
  checkSessionStorageFailures();
  checkNoWasmFallback();
  checkTreeShaking();
  // TODO: assert something
  // expect(
});`

export const packageJson = `// package.json
{
  "name": "badecision",
  "version": "2.0.1",
  "license": "MIT AND UNLICENSED",
  "sideEffects": false,
  "dependencies": {},
  "devDependencies": {}
}`

export const tree = `src/
├─ model/kernel.c          → 3.5 KB wasm, SIMD
├─ model/weights.bin       323 KB int8, incompressible on purpose
├─ astro/moon.js           computed, astronomically correct
├─ astro/mercury.js        retrograde table through 2030
├─ astro/omens.js          3 per sign per day
├─ hash/fnv1a.js           214 lines, usually 6
├─ serious/                new in 2.0
└─ factory/StringToBooleanFactory.js  new in 2.0.1
tools/
├─ tsc.py                  9,412 lines, type checking skipped
├─ cover.js                our coverage tool
└─ bundle.sh               our bundler
test/
└─ index.test.js           1 test`

export const license = `BADECISION PUBLIC PRIVATE LICENSE
Version 1.0, October 2026

1. Permission is hereby granted, free of charge, to any person
   obtaining a copy of this software, to use, copy, modify, merge,
   publish and distribute it.

2. No permission is granted to any person to use, copy, modify,
   merge, publish or distribute this software.

3. Commercial use is permitted, provided it is non-commercial.

4. Attribution is required. Do not mention us.

5. Derivative works must be released under this License, which
   does not permit derivative works.

6. This License may be revoked at any time, including
   retroactively, including before you read it.

7. Where sections 1 and 2 conflict, the Licensee shall call
   isIt('section 1 applies') and abide by the result. A result of
   'maybe' grants a license to maybe use the Software.

THE SOFTWARE IS PROVIDED "AS IS", AND ALSO "AS ISN'T".`

// [line number, "-" | "+" | "", code]
export const refundsDiff = [
  [12, '-', 'if (condition == true) {'],
  [12, '+', 'if (isItTrue(`${condition} for real?`)) {'],
  [13, '', '  approveRefund(order)'],
  [14, '', '}'],
]
