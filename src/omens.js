// Omens: the part of the horoscope that is about *content*. "Avoid red", "large numbers bring bad luck",
// "travel is favoured". An omen only does something when the sentence matches it:
//   "Should I buy the red car?" + "Avoid red."  -> pushed towards no
//   "Should I buy the blue car?" + "Avoid red." -> untouched
// The same rules label the training data for the decision model, which sees the omens as text in its input
// (decisionState) and learns to apply them itself, including to things the word lists below don't know.

import { LABELS, fnv1a } from './features.js';

const w = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

// group: colour | number | life. words: what a sentence must contain to match. aliases: how a free-text
// horoscope may name the topic (parseOmens). test: for number topics, a predicate over the numbers found.
export const TOPICS = {
  red: { group: 'colour', words: w('red,crimson,scarlet,ruby,tomato,strawberry,cherry,cherries,ferrari,blood,ketchup,lipstick,mars,lobster,raspberry,fire truck,fire engine') },
  blue: { group: 'colour', words: w('blue,navy,azure,sapphire,sky,ocean,sea,denim,jeans,blueberry,smurf') },
  green: { group: 'colour', words: w('green,emerald,grass,lime,leaf,leaves,forest,frog,cucumber,broccoli,spinach,salad,avocado,kiwi') },
  yellow: { group: 'colour', words: w('yellow,gold,golden,lemon,banana,sun,sunflower,canary,butter,taxi,cheese,corn') },
  black: { group: 'colour', words: w('black,dark,night,coal,ink,crow,raven,panther,coffee,licorice,liquorice') },
  white: { group: 'colour', words: w('white,snow,milk,cloud,ivory,pearl,salt,sugar,swan,polar bear,rice') },
  purple: { group: 'colour', words: w('purple,violet,lavender,lilac,plum,grape,eggplant,aubergine,amethyst') },
  orange: { group: 'colour', words: w('orange,carrot,pumpkin,tangerine,mandarin,apricot,tiger,goldfish,fox,peach') },
  pink: { group: 'colour', words: w('pink,rose,flamingo,salmon,bubblegum,pig,candy floss,cotton candy') },

  'large numbers': { group: 'number', aliases: w('large numbers,big numbers,high numbers,large amounts,big amounts,huge numbers'), test: (n, mag) => mag || n.some((x) => x >= 100) },
  'small numbers': { group: 'number', aliases: w('small numbers,low numbers,little numbers,small amounts'), test: (n) => n.some((x) => x >= 2 && x < 10) },
  'odd numbers': { group: 'number', aliases: w('odd numbers,odd number'), test: (n) => n.some((x) => Number.isInteger(x) && Math.abs(x) % 2 === 1) },
  'even numbers': { group: 'number', aliases: w('even numbers,even number'), test: (n) => n.some((x) => Number.isInteger(x) && x !== 0 && x % 2 === 0) },
  'the number 7': { group: 'number', aliases: w('the number 7,the number seven,number 7,number seven,sevens'), test: (n) => n.includes(7) },
  'the number 13': { group: 'number', aliases: w('the number 13,the number thirteen,number 13,number thirteen,thirteens'), test: (n) => n.includes(13) },

  money: { group: 'life', aliases: w('money,finances,finance,spending,wealth,cash,purchases,shopping'), words: w('money,cash,buy,buying,bought,spend,spending,price,cost,costs,expensive,cheap,invest,investment,loan,salary,pay,paying,rich,bank,euro,euros,dollar,dollars,bitcoin,crypto,lottery,afford,sell,selling,shop,shopping,save,savings'), symbols: /[€$£¥]/ },
  travel: { group: 'life', aliases: w('travel,travelling,traveling,journeys,journey,trips,trip,voyages'), words: w('travel,travelling,traveling,trip,journey,holiday,vacation,flight,fly,flying,plane,airport,train,abroad,visit,visiting,road trip,cruise,hotel,passport,suitcase,move to') },
  love: { group: 'life', aliases: w('love,romance,relationships,the heart,dating,partners'), words: w('love,date,dating,kiss,marry,married,marriage,wedding,crush,boyfriend,girlfriend,partner,husband,wife,romance,romantic,flirt,break up,propose,valentine,ex') },
  food: { group: 'life', aliases: w('food,eating,meals,cooking,snacks,sweets'), words: w('eat,eating,food,cook,cooking,dinner,lunch,breakfast,snack,cake,pizza,pasta,burger,chocolate,dessert,restaurant,meal,soup,bread,fries,ice cream,sushi,cookie,cookies,sandwich,taco,tacos') },
  water: { group: 'life', aliases: w('water,the sea,oceans,swimming,rain'), words: w('water,swim,swimming,sea,ocean,lake,river,beach,boat,sail,sailing,rain,pool,bath,shower,surf,surfing,fish,fishing,drink,wet') },
  work: { group: 'life', aliases: w('work,career,the office,your job,jobs,business'), words: w('work,job,boss,office,career,quit,promotion,raise,colleague,colleagues,interview,meeting,deadline,business,startup,resign,hire,fired,client,project,deploy,deployment,release,ship,shipping,launch,production,prod,on-call,sprint,standup') },
  animals: { group: 'life', aliases: w('animals,pets,creatures,beasts'), words: w('animal,pet,dog,dogs,cat,cats,puppy,kitten,horse,bird,birds,hamster,rabbit,snake,spider,cow,fish,parrot,turtle,lion,elephant,whale,bear,duck,penguin,goat') },
  technology: { group: 'life', aliases: w('technology,gadgets,screens,machines,computers'), words: w('phone,smartphone,computer,laptop,app,apps,internet,email,code,coding,program,software,ai,robot,gadget,tablet,console,tv,television,screen,update,upgrade,wifi,deploy,deployment,release,server,servers,database,merge,commit,push,git,production,prod,bug,bugs,hotfix,rollback,migration,kubernetes,docker,cloud,website,api') },
  'new beginnings': { group: 'life', aliases: w('new beginnings,new things,fresh starts,change,changes,beginnings'), words: w('new,start,starting,begin,beginning,change,changing,switch,move,moving,learn,learning,first,try,trying,adopt,launch,join') },
  music: { group: 'life', aliases: w('music,songs,singing,instruments'), words: w('music,song,songs,sing,singing,band,concert,guitar,piano,drums,violin,dance,dancing,album,playlist,karaoke,festival') },
  sport: { group: 'life', aliases: w('sport,sports,exercise,competition,games'), words: w('sport,sports,run,running,gym,exercise,football,soccer,tennis,basketball,match,race,marathon,bike,cycling,yoga,workout,ski,skiing,climb,climbing,win,compete') },
  ...Object.fromEntries(['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'].map((d) =>
    [d, { group: 'time', aliases: [d.toLowerCase(), d.slice(0, -1).toLowerCase()], words: [d.slice(0, -1).toLowerCase()] }])),
  weekends: { group: 'time', aliases: w('weekends,the weekend,weekend'), words: w('weekend') },
  ...Object.fromEntries(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) =>
    [m, { group: 'time', words: [m.toLowerCase()], ...(m === 'May' ? { re: /(?:^|[^A-Za-z])May(?![a-z])(?!\s+(?:I|we|you|he|she|they|it)\b)/ } : {}) }])),
  family: { group: 'life', aliases: w('family,relatives,parents,home life'), words: w('family,mum,mom,mother,dad,father,parents,brother,sister,son,daughter,grandma,grandmother,grandpa,grandfather,uncle,aunt,cousin,kids,children,baby') },
};

// what a matching omen does at full strength: move this fraction of each answer's probability to `to`.
// Open answers (maybe/unsure) mostly move, so decisions follow the omen; facts (yes/no) only wobble.
export const KINDS = {
  avoid: { to: 'no', take: { yes: 0.15, maybe: 0.75, unsure: 0.4 }, polarity: w('never,don\'t,do not,avoid,beware,steer clear,stay away,bad,unlucky,cursed,danger,dangerous,risky,unfavourable,unfavorable,misfortune,ill-starred,shun,keep away,trouble,doom') },
  favour: { to: 'yes', take: { no: 0.15, maybe: 0.75, unsure: 0.4 }, polarity: w('favour,favor,favoured,favored,favours,favors,lucky,luck,good,embrace,seek,blessed,fortune,fortunate,shine,shines,go for,welcome,auspicious,thrive') },
  clouded: { to: 'unsure', take: { yes: 0.25, no: 0.25, maybe: 0.75 }, polarity: w('clouded,cloudy,unclear,hidden,mysterious,foggy,murky,veiled,uncertain,obscure,shrouded,unreadable') },
};

// phrasings, so the decision model learns the idea rather than one template ({T} = topic name)
const PHRASES = {
  avoid: ['Avoid {t}.', '{T} brings bad luck today.', 'Steer clear of {t}.', 'Beware of {t}.', '{T} is unlucky for you today.'],
  favour: ['{T} is favoured today.', 'Lucky today: {t}.', 'Embrace {t}.', 'Fortune smiles on {t}.', '{T} brings good luck today.'],
  clouded: ['Anything involving {t} is clouded.', 'The stars are silent about {t}.', '{T} is shrouded in mystery today.', 'Matters of {t} are unclear today.'],
};

// "Should I avoid red?" / "Should I not buy the red car?": the omen's advice flips
const NEGATION = /\b(avoid|skip|stop|quit|cancel|postpone|never|not|no longer|stay away|give up|refuse|without)\b|n't\b/i;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (list) => new RegExp(`(?:^|[^a-z0-9])(?:${list.map(esc).sort((a, b) => b.length - a.length).join('|')})(?:s|es)?(?![a-z0-9])`, 'i');
for (const t of Object.values(TOPICS)) if (t.words && !t.re) t.re = wordRe(t.words);
const aliasRes = Object.entries(TOPICS).map(([name, t]) => [name, wordRe(t.aliases ?? [name.toLowerCase()])]);
const kindRes = Object.entries(KINDS).map(([k, v]) => [k, wordRe(v.polarity)]);

const UNITS = w('zero,one,two,three,four,five,six,seven,eight,nine,ten,eleven,twelve,thirteen,fourteen,fifteen,sixteen,seventeen,eighteen,nineteen');
const TENS = ['', '', ...w('twenty,thirty,forty,fifty,sixty,seventy,eighty,ninety')];
const MAGS = { hundred: 100, thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12, dozen: 12 };

/** Numbers in a sentence: digits ("1,000", "3.5") and words ("seventeen", "two hundred"). mag = a magnitude word was used. */
export function numbersIn(text) {
  const out = [];
  const t = String(text).toLowerCase();
  for (const m of t.matchAll(/\d[\d,]*(?:\.\d+)?/g)) out.push(+m[0].replace(/,(?=\d{3}\b)/g, ''));
  let cur = null, mag = false, prev = '';
  const flush = () => { if (cur !== null) out.push(cur); cur = null; };
  for (const tok of t.split(/[^a-z0-9]+/)) {
    const after = prev; prev = tok;
    if (tok === 'a' || (tok === 'and' && after in MAGS && cur !== null)) continue; // "a hundred", "two hundred and five"
    const u = UNITS.indexOf(tok), te = TENS.indexOf(tok);
    if (tok === 'one' && cur === null) continue; // "one" alone is usually a pronoun
    if (u >= 0) cur = (cur ?? 0) + u;
    else if (te >= 2) cur = (cur ?? 0) + te * 10;
    else if (tok in MAGS) { mag = mag || MAGS[tok] >= 100; cur = (cur ?? 1) * MAGS[tok]; }
    else flush();
  }
  flush();
  return { numbers: out.filter((x) => Number.isFinite(x)), magnitude: mag };
}

export const WEEKDAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const toDate = (d) => (d instanceof Date ? d : new Date(d));
const shift = (d, days) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
const dayTopics = (d) => [WEEKDAYS[d.getDay()], MONTHS[d.getMonth()], ...(d.getDay() % 6 === 0 ? ['weekends'] : [])];
// "Is it a good day to deploy?" / "Should I do it today?" talk about the date the question is asked
const TODAY = /\b(today|tonight|this (?:morning|afternoon|evening|day)|right now|a good day|the right day|good time)\b/i;
const TOMORROW = /\btomorrow\b/i;
const THIS_MONTH = /\bthis month\b/i, NEXT_MONTH = /\bnext month\b/i;

/** Which topics a sentence touches. With a date, "today" / "tomorrow" / "this month" count as that weekday and month. */
export function matchTopics(text, date) {
  const { numbers, magnitude } = numbersIn(text);
  const hits = new Set();
  for (const [name, t] of Object.entries(TOPICS)) {
    if (t.test ? t.test(numbers, magnitude) : t.re.test(` ${text} `) || t.symbols?.test(text)) hits.add(name);
  }
  if (date) {
    const d = toDate(date);
    if (TODAY.test(text)) dayTopics(d).forEach((x) => hits.add(x));
    if (TOMORROW.test(text)) dayTopics(shift(d, 1)).forEach((x) => hits.add(x));
    if (THIS_MONTH.test(text)) hits.add(MONTHS[d.getMonth()]);
    if (NEXT_MONTH.test(text)) hits.add(MONTHS[(d.getMonth() + 1) % 12]);
  }
  return [...hits];
}

const capital = (s) => s[0].toUpperCase() + s.slice(1);
export const omenText = (kind, topic, variant = 0) => {
  let p = PHRASES[kind][variant % PHRASES[kind].length];
  if (/s$/.test(topic) && !/^the number/.test(topic)) p = p.replace('{T} brings', '{T} bring').replace('{T} is', '{T} are');
  if (TOPICS[topic]?.group === 'time') p = p.replace(' today.', '.').replace('Lucky today:', 'Lucky:');
  return p.replace('{t}', topic).replace('{T}', capital(topic));
};

/**
 * Today's omens for someone: deterministic per (who, day). 3 omens, distinct topics, mostly colours and numbers.
 * Day/month omens usually name the current weekday, so "is it a good day to ...?" has something to go on.
 */
export function dailyOmens(seed, n = 3, date) {
  let h = fnv1a(String(seed));
  const next = () => (h = fnv1a(String(h)));
  const byGroup = (g) => Object.keys(TOPICS).filter((k) => TOPICS[k].group === g);
  const groups = { colour: byGroup('colour'), number: byGroup('number'), life: byGroup('life'), time: byGroup('time') };
  const kinds = ['avoid', 'favour', ['avoid', 'favour', 'clouded'][next() % 3]];
  const omens = [], used = new Set();
  for (let i = 0; i < n; i++) {
    const g = ['colour', 'number', 'life', 'colour', 'number', 'time'][next() % 6];
    const pool = g === 'time' && date && next() % 10 < 7 ? dayTopics(toDate(date)) : groups[g];
    let topic; do topic = pool[next() % pool.length]; while (used.has(topic) && used.size < 20 && pool.length > 1);
    used.add(topic);
    const kind = kinds[i % kinds.length];
    omens.push({ kind, topic, text: omenText(kind, topic, next()) });
  }
  return omens;
}

/** Read omens out of a free-text horoscope ("Avoid red today. Large numbers bring misfortune."). */
export function parseOmens(horoscope) {
  const omens = [];
  for (const s of String(horoscope).split(/(?<=[.!?;])\s+|\n+/).map((x) => x.trim()).filter(Boolean)) {
    const kind = kindRes.find(([, re]) => re.test(` ${s} `))?.[0];
    if (!kind) continue;
    for (const [topic, re] of aliasRes) if (re.test(` ${s} `)) omens.push({ kind, topic, text: s });
  }
  return omens;
}

/**
 * The text input of the decision model: the date (weekday and month, no numbers), the horoscope (omen list or raw
 * text, if any) and the sentence.
 */
export function decisionState(text, omens = [], date) {
  const h = (typeof omens === 'string' ? omens.trim() : omens.map((o) => o.text).join(' ')) || 'none';
  const d = date ? toDate(date) : null;
  const today = d ? `Today: ${WEEKDAYS[d.getDay()].slice(0, -1)} in ${MONTHS[d.getMonth()]}\n` : '';
  return `${today}Horoscope: ${h}\nQuestion: ${text}`;
}

/**
 * Apply matching omens to probabilities. Omens bite hardest on open questions (maybe/unsure mass) and only
 * nudge established facts: "Avoid red" turns "Should I buy the red car?" (maybe) into a no, but "Is a tomato
 * red?" (yes) only wobbles a little.
 */
export function applyOmens(probs, text, omens = [], strength = 1, date) {
  const topics = new Set(matchTopics(text, date));
  const hits = omens.filter((o) => topics.has(o.topic));
  if (!hits.length || !strength) return { probs: { ...probs }, hits };
  const flip = NEGATION.test(text);
  const p = { ...probs };
  for (const o of hits) {
    const kind = flip && o.kind !== 'clouded' ? (o.kind === 'avoid' ? 'favour' : 'avoid') : o.kind;
    const { to, take } = KINDS[kind];
    for (const [l, frac] of Object.entries(take)) { const moved = p[l] * Math.min(1, frac * strength); p[l] -= moved; p[to] += moved; }
  }
  return { probs: p, hits };
}
