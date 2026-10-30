#!/usr/bin/env node
// Builds the seed dataset: templated, plus facts handwritten by a human AI.
//   node scripts/build-seed-dataset.js            -> data/seed.train.jsonl, data/seed.val.jsonl
// Each line: {"text": "...", "probs": [yes, no, maybe, unsure], "src": "category"}
// Labels are SOFT on purpose: the model should learn graded confidence, not just a class.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- deterministic randomness ----------
let seed = 1337;
function rand() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (a) => a[Math.floor(rand() * a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;

// ---------- soft label presets: [yes, no, maybe, unsure] ----------
const P = {
  yes:      [0.90, 0.02, 0.05, 0.03],
  no:       [0.02, 0.90, 0.05, 0.03],
  yesish:   [0.70, 0.05, 0.20, 0.05],  // true in general, with exceptions
  noish:    [0.05, 0.70, 0.20, 0.05],
  maybe:    [0.10, 0.10, 0.70, 0.10],
  opinion:  [0.10, 0.10, 0.62, 0.18],
  unsure:   [0.03, 0.03, 0.14, 0.80],
  nonsense: [0.02, 0.05, 0.05, 0.88],
  deep:     [0.04, 0.06, 0.35, 0.55],  // metaphysics: nobody knows
};

const out = [];
const add = (text, probs, src) => out.push({ text, probs, src });

// ---------- helpers to vary a statement ----------
function negate(s) {
  const rules = [[/ is /, ' is not '], [/ are /, ' are not '], [/ can /, ' cannot '], [/ has /, ' does not have '], [/ have /, ' do not have '], [/ was /, ' was not '], [/ were /, ' were not ']];
  for (const [re, rep] of rules) if (re.test(s)) return s.replace(re, rep);
  return null;
}
function question(s) {
  // "The sun is hot" -> "Is the sun hot?"
  const m = s.match(/^(.*?) (is|are|can|was|were) (.*)$/);
  if (!m) return null;
  const subj = /^(the|a|an)\b/i.test(m[1]) ? m[1].charAt(0).toLowerCase() + m[1].slice(1) : m[1];
  return `${cap(m[2])} ${subj} ${m[3]}?`;
}
const flip = (p) => [p[1], p[0], p[2], p[3]];

/** Add a true/false statement plus its negation and question variants. */
function fact(s, truth, src, strength = 'strong') {
  const base = truth ? (strength === 'strong' ? P.yes : P.yesish) : (strength === 'strong' ? P.no : P.noish);
  add(cap(s), base, src);
  const n = negate(s);
  if (n && rand() < 0.5) add(cap(n), flip(base), src + ':neg');
  const q = question(s);
  if (q && rand() < 0.5) add(q, base, src + ':q');
}

// =====================================================================
// 1. Category membership (big combinatorial source of yes/no)
// =====================================================================
const CATS = {
  mammal: ['dog', 'cat', 'horse', 'cow', 'lion', 'tiger', 'elephant', 'mouse', 'rabbit', 'wolf', 'bear', 'fox', 'sheep', 'goat', 'pig', 'monkey', 'giraffe', 'zebra', 'camel', 'kangaroo', 'dolphin', 'whale', 'bat', 'hamster', 'squirrel'],
  bird: ['eagle', 'owl', 'penguin', 'parrot', 'sparrow', 'crow', 'pigeon', 'duck', 'swan', 'ostrich', 'flamingo', 'chicken', 'robin', 'seagull'],
  fish: ['shark', 'salmon', 'trout', 'goldfish', 'tuna', 'cod', 'carp', 'herring'],
  reptile: ['snake', 'lizard', 'turtle', 'crocodile', 'iguana', 'alligator', 'gecko'],
  insect: ['bee', 'ant', 'butterfly', 'mosquito', 'beetle', 'wasp', 'fly', 'ladybug', 'grasshopper'],
  fruit: ['apple', 'banana', 'orange', 'grape', 'mango', 'pear', 'cherry', 'strawberry', 'pineapple', 'lemon', 'peach', 'watermelon', 'plum', 'kiwi', 'apricot'],
  vegetable: ['carrot', 'potato', 'onion', 'cabbage', 'broccoli', 'lettuce', 'spinach', 'cucumber', 'celery', 'leek', 'beetroot', 'cauliflower'],
  vehicle: ['car', 'bus', 'bicycle', 'train', 'truck', 'motorcycle', 'airplane', 'boat', 'helicopter', 'tram', 'scooter', 'submarine'],
  'musical instrument': ['piano', 'guitar', 'violin', 'drum', 'flute', 'trumpet', 'cello', 'harp', 'saxophone', 'accordion'],
  tool: ['hammer', 'screwdriver', 'saw', 'wrench', 'drill', 'shovel', 'chisel'],
  'piece of furniture': ['chair', 'table', 'sofa', 'bed', 'desk', 'wardrobe', 'bookshelf', 'stool'],
  metal: ['iron', 'gold', 'silver', 'copper', 'aluminium', 'lead', 'zinc', 'tin'],
  color: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black', 'white', 'pink', 'brown'],
  planet: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'],
};
const SUPER = { mammal: 'animal', bird: 'animal', fish: 'animal', reptile: 'animal', insect: 'animal', fruit: 'food', vegetable: 'food' };
const catNames = Object.keys(CATS);
const isIn = (x, c) => CATS[c].includes(x);

for (const c of catNames) {
  for (const x of CATS[c]) {
    const proper = c === 'planet';
    const subj = c === 'color' || c === 'metal' ? cap(x) : proper ? x : an(x);
    fact(`${subj} is ${an(c)}`, true, 'member');
    if (SUPER[c]) fact(`${subj} is ${an(SUPER[c])}`, true, 'member');
    // wrong categories: as many false rows as true rows, so 'no' isn't the safe default
    for (let k = 0; k < (SUPER[c] ? 2 : 1); k++) {
      let w; do { w = pick(catNames); } while (isIn(x, w) || (w === 'fruit' && c === 'vegetable') || (w === 'vegetable' && c === 'fruit'));
      fact(`${subj} is ${an(w)}`, false, 'member');
    }
  }
}
// famous edge cases -> maybe-ish
for (const [s, p] of [
  ['A tomato is a vegetable', [0.30, 0.25, 0.40, 0.05]], ['A tomato is a fruit', [0.55, 0.08, 0.32, 0.05]],
  ['Pluto is a planet', [0.15, 0.40, 0.40, 0.05]], ['A hot dog is a sandwich', P.opinion],
  ['Cereal is a soup', [0.05, 0.45, 0.40, 0.10]], ['A bat is a bird', P.no], ['A whale is a fish', P.no],
  ['A spider is an insect', P.no], ['A strawberry is a berry', [0.20, 0.45, 0.30, 0.05]],
  ['A peanut is a nut', [0.30, 0.30, 0.35, 0.05]], ['A penguin is a bird', P.yes], ['A dolphin is a mammal', P.yes],
  ['The sun is a star', P.yes], ['The moon is a planet', P.no], ['The sun is a planet', P.no],
]) add(s, p, 'edge');

// =====================================================================
// 2. Facts handwritten by a human AI (true / false)
// =====================================================================
const TRUE = [
  'Fire is hot', 'Ice is cold', 'Water is wet', 'Snow is cold', 'The sun is hot', 'Lava is hot', 'The sky is blue on a clear day',
  'Grass is green', 'Blood is red', 'Milk is white', 'Coal is black', 'Bananas are yellow when ripe', 'Lemons are sour', 'Sugar is sweet',
  'Salt is salty', 'Stones are hard', 'Feathers are light', 'Lead is heavy', 'Diamonds are hard', 'Glass is fragile',
  'Fish can swim', 'Birds have feathers', 'Dogs can bark', 'Cats can climb trees', 'Bees make honey', 'Cows give milk',
  'Spiders have eight legs', 'Insects have six legs', 'Humans have two legs', 'A triangle has three sides', 'A square has four sides',
  'A week has seven days', 'A year has twelve months', 'A day has twenty four hours', 'An hour has sixty minutes', 'A minute has sixty seconds',
  'Water boils at 100 degrees Celsius at sea level', 'Water freezes at 0 degrees Celsius', 'The earth orbits the sun',
  'The moon orbits the earth', 'The earth is round', 'Plants need sunlight to grow', 'Humans need oxygen to live', 'Fish breathe through gills',
  'Paris is in France', 'Tokyo is in Japan', 'Berlin is in Germany', 'Rome is in Italy', 'Madrid is in Spain', 'Brussels is in Belgium',
  'The Pacific is an ocean', 'Mount Everest is the highest mountain on earth', 'The Sahara is a desert', 'Antarctica is cold',
  'Penguins live in the southern hemisphere', 'Camels can survive long without water', 'Cheetahs are very fast', 'Snails are slow',
  'Elephants are large', 'Mice are small', 'Whales live in the ocean', 'Owls are active at night', 'Bats can fly',
  'Ducks can swim', 'Horses can run', 'Kangaroos can jump', 'Frogs can jump', 'Babies cry', 'People sleep at night',
  'Rain is made of water', 'Clouds are made of water droplets', 'Thunder follows lightning', 'Magnets attract iron',
  'Metal conducts electricity', 'Rubber is a good insulator', 'Wood floats on water', 'Oil floats on water', 'Steel is strong',
  'Trees have roots', 'Roses have thorns', 'Apples grow on trees', 'Bread is made from flour', 'Cheese is made from milk',
  'Wine is made from grapes', 'Chocolate is made from cocoa', 'Coffee contains caffeine', 'Oranges contain vitamin C',
  'Shakespeare wrote plays', 'Mozart was a composer', 'Einstein was a physicist', 'The Titanic sank', 'Dinosaurs are extinct',
  'Humans landed on the moon', 'The internet exists', 'Computers use electricity', 'Phones can make calls', 'Cars have wheels',
  'Bicycles have two wheels', 'Airplanes can fly', 'Boats float', 'Keys open locks', 'Books contain pages', 'Clocks tell time',
  'Two plus two is four', 'Ten is bigger than five', 'Three is an odd number', 'Four is an even number', 'Zero is less than one',
  'A dozen is twelve', 'A circle is round', 'Summer is warmer than winter', 'Night is darker than day', 'Light travels faster than sound',
];
const FALSE = [
  'Fire is cold', 'Ice is hot', 'Snow is hot', 'The sun is cold', 'Grass is purple', 'The sky is green', 'Blood is blue',
  'Milk is black', 'Coal is white', 'Lemons are sweet', 'Sugar is salty', 'Feathers are heavy', 'Stones are soft', 'Glass is unbreakable',
  'Fish can fly', 'Dogs can fly', 'Cats can talk', 'Cows can fly', 'Penguins can fly', 'Elephants can fly', 'Pigs can fly', 'Snakes have legs',
  'Spiders have six legs', 'Insects have ten legs', 'Humans have three legs', 'A triangle has four sides', 'A square has three sides',
  'A week has ten days', 'A year has five months', 'A day has fifty hours', 'An hour has ten minutes',
  'Water boils at 10 degrees Celsius', 'Water freezes at 50 degrees Celsius', 'The sun orbits the earth', 'The earth is flat',
  'The moon is made of cheese', 'Plants grow best in total darkness', 'Humans can breathe underwater', 'Fish breathe air through lungs',
  'Paris is in Germany', 'Tokyo is in China', 'Berlin is in Spain', 'Rome is in Brazil', 'Madrid is in Sweden', 'Brussels is in Canada',
  'The Sahara is an ocean', 'Antarctica is hot', 'Penguins live at the north pole', 'Cheetahs are slow', 'Snails are fast',
  'Elephants are tiny', 'Mice are huge', 'Whales live in trees', 'Owls are made of metal', 'Rain is made of sand',
  'Magnets attract wood', 'Rubber conducts electricity well', 'Wood sinks in water like a rock', 'Steel is softer than butter',
  'Trees grow upside down', 'Apples grow underground', 'Bread is made from rocks', 'Cheese is made from wood', 'Wine is made from potatoes',
  'Shakespeare was a pop singer', 'Mozart invented the telephone', 'Einstein was a professional footballer', 'Dinosaurs are alive today in cities',
  'Humans landed on the sun', 'Cars have wings', 'Bicycles have ten wheels', 'Boats are made to sink', 'Clocks tell the weather',
  'Two plus two is five', 'Five is bigger than ten', 'Three is an even number', 'Four is an odd number', 'Zero is bigger than one',
  'A dozen is twenty', 'A circle has corners', 'Winter is warmer than summer', 'Night is brighter than day', 'Sound travels faster than light',
  'Babies can drive cars', 'Horses can read', 'Bananas are blue when ripe', 'Chocolate grows on pine trees', 'Coffee is made from milk',
];
for (const s of TRUE) fact(s, true, 'fact');
for (const s of FALSE) fact(s, false, 'fact');

// mostly-true generalisations with famous exceptions
for (const s of ['Birds can fly', 'Mammals live on land', 'Cats hate water', 'Dogs are friendly', 'Summers are hot', 'Fruit is sweet', 'Trains are on time in Japan'])
  fact(s, true, 'general', 'weak');
for (const s of ['Bulls are angered by the color red', 'Goldfish have a three second memory', 'We only use ten percent of our brain', 'Lightning never strikes the same place twice', 'The Great Wall of China is visible from space'])
  fact(s, false, 'myth', 'weak');

// =====================================================================
// 3. Capitals
// =====================================================================
const CAPITALS = [
  ['France', 'Paris'], ['Germany', 'Berlin'], ['Italy', 'Rome'], ['Spain', 'Madrid'], ['Belgium', 'Brussels'], ['Netherlands', 'Amsterdam'],
  ['Portugal', 'Lisbon'], ['Austria', 'Vienna'], ['Poland', 'Warsaw'], ['Sweden', 'Stockholm'], ['Norway', 'Oslo'], ['Denmark', 'Copenhagen'],
  ['Finland', 'Helsinki'], ['Greece', 'Athens'], ['Ireland', 'Dublin'], ['the United Kingdom', 'London'], ['Japan', 'Tokyo'], ['China', 'Beijing'],
  ['India', 'New Delhi'], ['Russia', 'Moscow'], ['Egypt', 'Cairo'], ['Kenya', 'Nairobi'], ['Canada', 'Ottawa'], ['the United States', 'Washington'],
  ['Mexico', 'Mexico City'], ['Brazil', 'Brasilia'], ['Argentina', 'Buenos Aires'], ['Peru', 'Lima'], ['Australia', 'Canberra'],
  ['South Korea', 'Seoul'], ['Thailand', 'Bangkok'], ['Turkey', 'Ankara'], ['Hungary', 'Budapest'], ['Czechia', 'Prague'], ['Switzerland', 'Bern'],
];
for (const [c, cap_] of CAPITALS) {
  fact(`The capital of ${c} is ${cap_}`, true, 'capital');
  if (rand() < 0.5) add(`${cap_} is the capital of ${c}`, P.yes, 'capital');
  for (let k = 0; k < 1; k++) {
    const [, wrong] = pick(CAPITALS.filter(([x]) => x !== c));
    fact(`The capital of ${c} is ${wrong}`, false, 'capital');
  }
}
// common misconceptions -> the model should be a bit hesitant
for (const [s, p] of [['The capital of Australia is Sydney', [0.12, 0.70, 0.13, 0.05]], ['The capital of Canada is Toronto', [0.12, 0.70, 0.13, 0.05]], ['The capital of Turkey is Istanbul', [0.12, 0.70, 0.13, 0.05]], ['The capital of Switzerland is Zurich', [0.10, 0.65, 0.15, 0.10]]])
  add(s, p, 'capital:trick');

// =====================================================================
// 4. Ordered comparisons
// =====================================================================
const ORDERS = [
  { items: ['an ant', 'a mouse', 'a rabbit', 'a cat', 'a dog', 'a sheep', 'a horse', 'an elephant', 'a blue whale'], up: 'bigger', down: 'smaller' },
  { items: ['a snail', 'a tortoise', 'a chicken', 'a human', 'a horse', 'a cheetah'], up: 'faster', down: 'slower' },
  { items: ['ice', 'cold water', 'a warm bath', 'boiling water', 'lava', 'the surface of the sun'], up: 'hotter', down: 'colder' },
  { items: ['a feather', 'an apple', 'a brick', 'a person', 'a car', 'a truck'], up: 'heavier', down: 'lighter' },
  { items: ['a pond', 'a lake', 'a sea', 'an ocean'], up: 'bigger', down: 'smaller' },
  { items: ['a minute', 'an hour', 'a day', 'a week', 'a month', 'a year', 'a century'], up: 'longer', down: 'shorter' },
  { items: ['one', 'five', 'ten', 'fifty', 'a hundred', 'a thousand', 'a million'], up: 'bigger', down: 'smaller' },
];
for (const { items, up, down } of ORDERS) {
  for (let i = 0; i < items.length; i++) for (let j = 0; j < items.length; j++) {
    if (i === j || rand() < 0.35) continue;
    const word = rand() < 0.5 ? up : down;
    const truth = word === up ? i > j : i < j;
    const t = rand() < 0.75 ? `${cap(items[i])} is ${word} than ${items[j]}` : `Is ${items[i]} ${word} than ${items[j]}?`;
    add(t, truth ? P.yes : P.no, 'compare');
  }
}
const HISTORY = ['the pyramids', 'the Roman Empire', 'the printing press', 'the steam engine', 'the telephone', 'the airplane', 'television', 'the internet', 'the smartphone'];
for (let i = 0; i < HISTORY.length; i++) for (let j = 0; j < HISTORY.length; j++) {
  if (i === j || rand() < 0.4) continue;
  const before = rand() < 0.5;
  add(`${cap(HISTORY[i])} came ${before ? 'before' : 'after'} ${HISTORY[j]}`, (before ? i < j : i > j) ? P.yes : P.no, 'history');
}

// =====================================================================
// 5. Simple arithmetic (memorisable via trigram features)
// =====================================================================
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
for (let a = 0; a <= 10; a++) for (let b = 0; b <= 10; b++) {
  const wrong = a + b + pick([-2, -1, 1, 2, 3]);
  if (rand() < 0.6) add(`${a} + ${b} = ${a + b}`, P.yes, 'math');
  if (rand() < 0.6 && wrong >= 0) add(`${a} + ${b} = ${wrong}`, P.no, 'math');
  if (rand() < 0.15) add(`${cap(NUMW[a])} plus ${NUMW[b]} is ${NUMW[a + b]}`, P.yes, 'math');
  if (rand() < 0.15 && wrong >= 0 && wrong <= 20) add(`${cap(NUMW[a])} plus ${NUMW[b]} is ${NUMW[wrong]}`, P.no, 'math');
}

// =====================================================================
// 6. MAYBE: predictions, chance, opinions, personal decisions, hedges
// =====================================================================
const CITIES = ['Brussels', 'London', 'Paris', 'Berlin', 'Tokyo', 'New York', 'Amsterdam', 'Madrid', 'my town', 'here'];
const WHEN = ['tomorrow', 'next week', 'this weekend', 'on Saturday', 'tonight', 'later today', 'next month', 'on Monday'];
for (let k = 0; k < 260; k++) {
  const t = pick([
    () => `It will rain ${pick(WHEN)} in ${pick(CITIES)}`,
    () => `It will be sunny ${pick(WHEN)}`,
    () => `It might snow ${pick(WHEN)}`,
    () => `Will it rain ${pick(WHEN)}?`,
    () => `The weather will be nice ${pick(WHEN)}`,
    () => `It will be windy ${pick(WHEN)} in ${pick(CITIES)}`,
  ])();
  add(t, P.maybe, 'maybe:weather');
}
const CHANCE = [
  'The coin will land on heads', 'I will roll a six', 'The next card will be red', 'My train will be late', 'The meeting will run over',
  'The package will arrive today', 'The bus will be on time', 'I will find a parking spot', 'The restaurant will be busy tonight',
  'My team will win the next match', 'The printer will work today', 'The build will pass on the first try', 'The cake will rise',
  'The baby will sleep through the night', 'The flight will be delayed', 'My code will compile', 'The concert will sell out',
  'Someone will reply to my email today', 'The traffic will be bad', 'The shop is still open', 'There is milk left in the fridge',
  'The cat wants to go outside', 'My phone battery will last all day', 'The plant will survive the winter', 'The price will go up',
];
for (const s of CHANCE) { add(s, P.maybe, 'maybe:chance'); if (rand() < 0.4) add(`Will ${s.charAt(0).toLowerCase() + s.slice(1).replace(/ will /, ' ')}?`.replace(/^Will the coin land/, 'Will the coin land'), P.maybe, 'maybe:chance:q'); }
const FOODS = ['pizza', 'sushi', 'pasta', 'tacos', 'ramen', 'curry', 'fries', 'chocolate', 'broccoli', 'cheese', 'waffles', 'pancakes'];
const THINGS = ['cats', 'dogs', 'coffee', 'tea', 'jazz', 'pop music', 'summer', 'winter', 'the beach', 'the mountains', 'books', 'movies', 'tabs', 'spaces', 'vim', 'emacs', 'dark mode', 'light mode'];
for (let k = 0; k < 300; k++) {
  const a = pick(THINGS); let b; do { b = pick(THINGS); } while (b === a);
  const t = pick([
    () => `${cap(pick(FOODS))} is the best food`,
    () => `${cap(a)} are better than ${b}`.replace(/(coffee|tea|jazz|pop music|summer|winter|the beach|the mountains|vim|emacs|dark mode|light mode) are/, '$1 is'),
    () => `${cap(pick(CITIES.slice(0, 8)))} is the best city to live in`,
    () => `Pineapple belongs on pizza`,
    () => `${cap(pick(FOODS))} tastes good`,
    () => `${cap(a)} are overrated`.replace(/(coffee|tea|jazz|pop music|summer|winter|the beach|the mountains|vim|emacs|dark mode|light mode) are/, '$1 is'),
    () => `Is ${pick(FOODS)} better than ${pick(FOODS)}?`,
    () => `${cap(pick(['Monday', 'Friday', 'Sunday']))} is the best day of the week`,
    () => `This song is good`,
    () => `Modern art is real art`,
  ])();
  add(t, P.opinion, 'maybe:opinion');
}
const DECISIONS = [
  'I should take the job', 'I should text them back', 'I should buy the new phone', 'I should go to the party', 'I should learn Rust',
  'I should move to another city', 'I should quit coffee', 'I should adopt a dog', 'I should ask for a raise', 'I should go to bed now',
  'I should rewrite it in TypeScript', 'I should start running', 'I should call my mom', 'I should order pizza tonight', 'I should paint the wall blue',
  'It is a good idea to go out tonight', 'It is a good idea to invest in gold', 'It is a good idea to refactor this code', 'I will enjoy the movie',
  'She likes me', 'He will say yes', 'They will like the present', 'The interview went well', 'This is a good name for a cat',
];
for (const s of DECISIONS) {
  add(s, P.maybe, 'maybe:decision');
  if (s.startsWith('I should ')) add(`Should I ${s.slice(9)}?`, P.maybe, 'maybe:decision:q');
}
// hedged versions of plain facts -> pushes toward maybe
const HEDGES = ['probably', 'maybe', 'possibly', 'perhaps', 'might be'];
for (let k = 0; k < 120; k++) {
  const s = pick([...CHANCE, ...DECISIONS]);
  add(`${cap(pick(HEDGES))} ${s.charAt(0).toLowerCase() + s.slice(1)}`.replace('Might be ', 'It might be that '), P.maybe, 'maybe:hedge');
}
for (const s of ['Money buys happiness', 'Video games are good for you', 'Breakfast is the most important meal of the day', 'Remote work is more productive',
  'Social media makes people unhappy', 'Cats are smarter than dogs', 'Robots will take most jobs', 'Humans will live on Mars one day',
  'Artificial intelligence will become conscious', 'Coffee is healthy', 'Red wine is good for the heart', 'Most people like chocolate',
  'Electric cars are the future', 'Tabs are better than spaces', 'JavaScript is a good language', 'Working at night is more creative'])
  add(s, P.opinion, 'maybe:contested');

// =====================================================================
// 7. UNSURE: private info, unknowable numbers, future specifics, nonsense
// =====================================================================
const RELS = ['mother', 'father', 'sister', 'brother', 'neighbour', 'boss', 'colleague', 'best friend', 'landlord', 'dentist', 'cousin', 'grandmother'];
const NAMES = ['Kevin', 'Marie', 'Ahmed', 'Sofia', 'Jan', 'Yuki', 'Liam', 'Chloe', 'Pieter', 'Fatima', 'Lucas', 'Emma'];
const OBJS = ['a red sock', 'a banana', 'three keys', 'a secret diary', 'a rubber duck', 'twelve coins', 'a lottery ticket', 'a blue umbrella'];
const PLACES = ['pocket', 'fridge', 'garage', 'drawer', 'backpack', 'basement', 'car', 'attic'];
for (let k = 0; k < 450; k++) {
  const n = Math.floor(rand() * 9000) + 3;
  const t = pick([
    () => `My ${pick(RELS)} is thinking about ${pick(FOODS)} right now`,
    () => `My ${pick(RELS)} has ${pick(OBJS)} in their ${pick(PLACES)}`,
    () => `The person next to me has ${n % 40} coins in their pocket`,
    () => `My ${pick(RELS)}'s cat is called ${pick(NAMES)}`,
    () => `${pick(NAMES)} from accounting secretly plays the ${pick(CATS['musical instrument'])}`,
    () => `The stranger on the bus is named ${pick(NAMES)}`,
    () => `My ${pick(RELS)} had ${pick(FOODS)} for breakfast`,
    () => `Your password ends with the number ${n % 10}`,
    () => `There are exactly ${n} grains of sand in my shoe`,
    () => `Exactly ${n} people are sneezing right now`,
    () => `There are ${n} leaves on the tree outside my window`,
    () => `The number of stars in the universe is ${pick(['even', 'odd'])}`,
    () => `The ${pick(['next', 'first'])} person to walk in will be called ${pick(NAMES)}`,
    () => `On ${pick(['March', 'July', 'October', 'December'])} ${1 + (n % 28)}, ${2040 + (n % 50)} it will rain in ${pick(CITIES)}`,
    () => `The lottery numbers next week will include ${n % 50}`,
    () => `The ${2038 + 4 * (n % 10)} World Cup will be won by ${pick(['Belgium', 'Brazil', 'Japan', 'France', 'Germany', 'Argentina'])}`,
    () => `The stock market will close up exactly ${n % 7}.${n % 10} percent next ${pick(['Monday', 'Friday'])}`,
    () => `Shakespeare owned exactly ${n % 15} cats`,
    () => `Napoleon's favourite food was ${pick(FOODS)}`,
    () => `Cleopatra ate ${pick(FOODS)} on her birthday`,
    () => `What is my ${pick(RELS)} doing right now?`,
    () => `Is my ${pick(RELS)} at home?`,
    () => `Am I going to win the lottery?`,
    () => `How many hairs are on my head?`,
    () => `I left ${pick(OBJS)} in the ${pick(PLACES)}`,
    () => `Did my ${pick(RELS)} lock the door?`,
  ])();
  add(t, P.unsure, 'unsure:unknowable');
}
// nonsense / made-up words / category errors
const SYL = ['zor', 'blim', 'quax', 'flur', 'gnop', 'trel', 'vasp', 'mib', 'krel', 'yon', 'plib', 'dros', 'wex', 'fum', 'sni', 'grob', 'tav', 'lurk', 'oob', 'zinth'];
const pw = () => { let w = ''; const n = 2 + Math.floor(rand() * 2); for (let i = 0; i < n; i++) w += pick(SYL); return w; };
for (let k = 0; k < 280; k++) {
  const t = pick([
    () => `The ${pw()} is ${pw()}`,
    () => `All ${pw()}s are ${pw()}`,
    () => `Can a ${pw()} ${pw()}?`,
    () => `${cap(pw())} ${pw()} ${pw()}`,
    () => `Is the ${pw()} bigger than a ${pw()}?`,
    () => `A ${pick(CATS.mammal)} is a ${pw()}`,
    () => `${cap(pw())} is the capital of ${pw()}`,
    () => `Seven is jealous of ${pick(CATS.color)}`,
    () => `The color ${pick(CATS.color)} tastes like ${pick(['Tuesday', 'jazz', 'mathematics', 'regret'])}`,
    () => `Is the number ${pick(NUMW)} ${pick(['sleepy', 'hungry', 'angry', 'in love'])}?`,
    () => `${cap(pick(CATS.color))} is heavier than ${pick(['happiness', 'Thursday', 'silence', 'the alphabet'])}`,
    () => `Tuesday is ${pick(['taller', 'wetter', 'louder'])} than ${pick(['purple', 'nine', 'a melody'])}`,
    () => Array.from({ length: 2 + Math.floor(rand() * 3) }, () => Array.from({ length: 4 + Math.floor(rand() * 4) }, () => 'bcdfghjklmnpqrstvwxz'[Math.floor(rand() * 20)]).join('')).join(' '),
    () => '?',
    () => pick(['asdf', 'qwerty', 'lorem ipsum dolor', 'hmm', '...', 'test', 'blah blah', 'xyz']),
  ])();
  add(t, P.nonsense, 'unsure:nonsense');
}
for (const s of ['There is life after death', 'We live in a simulation', 'God exists', 'Aliens have secretly visited Earth', 'Time had a beginning',
  'There are other universes', 'Free will is real', 'Animals have souls', 'Ghosts exist', 'Everything happens for a reason', 'Fate is real',
  'The universe will end one day', 'There is intelligent life on other planets', 'Dreams can predict the future', 'Is there a meaning of life?'])
  add(s, P.deep, 'unsure:deep');

// ---------- dedupe, shuffle, split ----------
const seen = new Set();
const rows = shuffle(out.filter((r) => { const k = r.text.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }));
const nVal = Math.round(rows.length * 0.1);
const val = rows.slice(0, nVal), train = rows.slice(nVal);

mkdirSync(join(ROOT, 'data'), { recursive: true });
const dump = (f, r) => writeFileSync(join(ROOT, 'data', f), r.map((x) => JSON.stringify(x)).join('\n') + '\n');
dump('seed.train.jsonl', train);
dump('seed.val.jsonl', val);

const dist = [0, 0, 0, 0];
for (const r of rows) dist[r.probs.indexOf(Math.max(...r.probs))]++;
console.log(`seed dataset: ${rows.length} rows (train ${train.length}, val ${val.length})`);
console.log('argmax distribution:', Object.fromEntries(['yes', 'no', 'maybe', 'unsure'].map((l, i) => [l, dist[i]])));
