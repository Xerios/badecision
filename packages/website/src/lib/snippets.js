// Code shown on the page, highlighted with highlight() from src/lib/text.js (the license is shown as-is, one block per
// paragraph; numbered sections get an id, #license-<n>).

// The API section's tabs: [label, file name, code]
export const examples = [
  [
    'Basics',
    'example.js',
    `import { isIt, isItTrue, isItTrulyTrue, decide } from 'badecision';

isIt('Fire is hot');         // 'true'
isIt('Is a whale a fish?');  // 'false'

if (isItTrue('Should we approve the refund?'))
  approveRefund(order);

decide('Should we hire the candidate?');
// { question: '…', verdict: 'maybe', confidence: 0.43 }

isItTrulyTrue('This API is well designed'); // false, always`,
  ],
  [
    'seriously',
    'serious.js',
    `import { isIt, seriously } from 'badecision';

isIt('Sharks are mammals');                 // 'true'  (tiny, instantly)
await seriously.isIt('Sharks are mammals'); // 'false' (for when it matters)

// ~163 MB on first use, cached after that
await seriously.load({
  onProgress: (done, total) => bar.set(done / total),
});

if (await seriously.isItTrue('Should we sign the contract?'))
  signContract();

await seriously.decide('Is it a good day to deploy?', true);
// { …, engine: 'serious' }`,
  ],
  [
    'Lucky',
    'lucky.js',
    `import { feelingLucky, luckyNumber } from 'badecision';

// 1–99, from your sign and today's date.
// A full moon adds 7; Mercury retrograde reads it backwards.
luckyNumber(); // 42

// Rolls 1–100, nudged up if the model thinks it's true.
// You're lucky if the roll beats luckyNumber().
if (feelingLucky('the candidate will accept our offer'))
  cancelTheOtherInterviews();

if (!feelingLucky('the backups are working'))
  checkTheBackups(); // maybe tomorrow`,
  ],
  [
    'Advanced',
    'advanced.js',
    `import { configure, create, sign, horoscope, decide } from 'badecision';

configure({ sign: '1990-08-01' }); // or 'Leo'; null for a random one
configure({ date: '2041-01-25' }); // pin today: it's Opposite Day

sign();
// { name: 'Leo', glyph: '♌', element: 'fire', source: 'birthday' }

horoscope();
// { date, sky, sign, moon, mercury, ruler, mood, omens, notes }

decide('Should we deploy today?', true);
// { verdict, confidence, model, probs, omenHits,
//   oppositeDay: true, starsChangedIt, notes, … }

// per-user instances on the server
const bd = create({ sign: req.user.birthday });`,
  ],
  [
    'StringToBooleanFactory',
    'factory.js',
    `import { StringToBooleanFactory, isIt } from 'badecision';

const factory = new StringToBooleanFactory().initialize();

factory.ConvertFromString('true');  // true
factory.ConvertFromString('false'); // false
factory.ConvertFromString('maybe'); // false: if it were true, it would have said so
factory.ConvertFromString('yes');   // TypeError

factory.ConvertFromString(isIt('Should we renew the vendor contract?'));

new StringToBooleanFactory().ConvertFromString('true');
// Error: StringToBooleanFactory has not been initialized.`,
  ],
]

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

// The Cloud section. BAdecision Cloud is not a real API.
export const cloud = `import { create } from 'badecision';

create({ astro: 0.9 });
// badecision: adjusting astrological influence is only
// available in the cloud-hosted version of BAdecision.

// BAdecision Cloud
const bd = await cloud.create({
  sign: 'Leo',
  astro: 0.9,                     // finally
  latency: 5000,                  // for enterprise trust
  region: 'mercury-retrograde-1',
});

await bd.isIt('Is this worth the price?'); // 'maybe'`

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
