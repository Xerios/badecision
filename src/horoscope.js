// The horoscope layer. Two kinds of influence:
//   - mood: sun sign, moon, Mercury, weekday ruler. A general tilt applied to every answer, after the model.
//   - omens (src/omens.js): "avoid red", "large numbers bring bad luck". Only bite when the sentence matches.
//     The decision model reads them as part of its input and applies them itself; for the tiny model they are
//     applied here with the same rules. Strength 0 switches everything off.
//
// Inputs: the date (default now) and an optional birthday. Everything is deterministic:
// the same person on the same day always gets the same cosmic nudge.
//
// Ingredients
//   - sun sign + element of the birthday (fire = decisive, water = wishy-washy, ...)
//   - moon phase (computed from a reference new moon)
//   - Mercury retrograde (table 2025-2030 from the Farmers' Almanac, approximated after that)
//   - planetary ruler of the weekday (Saturn's day says no more often, Jupiter's says yes)
//   - a daily "cosmic mood" seeded from sign + date

import { LABELS, fnv1a } from './features.js';
import { dailyOmens, parseOmens, applyOmens } from './omens.js';

const DAY = 86400000;

export const SIGNS = [
  // [name, glyph, element, start month, start day]
  ['Capricorn', '♑', 'earth', 12, 22], ['Aquarius', '♒', 'air', 1, 20], ['Pisces', '♓', 'water', 2, 19],
  ['Aries', '♈', 'fire', 3, 21], ['Taurus', '♉', 'earth', 4, 20], ['Gemini', '♊', 'air', 5, 21],
  ['Cancer', '♋', 'water', 6, 21], ['Leo', '♌', 'fire', 7, 23], ['Virgo', '♍', 'earth', 8, 23],
  ['Libra', '♎', 'air', 9, 23], ['Scorpio', '♏', 'water', 10, 23], ['Sagittarius', '♐', 'fire', 11, 22],
];

// Mercury retrograde periods (inclusive, ET dates). Source: Farmers' Almanac.
export const MERCURY_RETROGRADE = [
  ['2025-03-15', '2025-04-07'], ['2025-07-18', '2025-08-11'], ['2025-11-09', '2025-11-29'],
  ['2026-02-26', '2026-03-20'], ['2026-06-29', '2026-07-23'], ['2026-10-24', '2026-11-13'],
  ['2027-02-09', '2027-03-03'], ['2027-06-10', '2027-07-04'], ['2027-10-07', '2027-10-28'],
  ['2028-01-24', '2028-02-14'], ['2028-05-21', '2028-06-13'], ['2028-09-19', '2028-10-11'],
  ['2029-01-07', '2029-01-27'], ['2029-05-01', '2029-05-25'], ['2029-09-02', '2029-09-24'],
  ['2029-12-22', '2030-01-11'], ['2030-04-12', '2030-05-06'], ['2030-08-15', '2030-09-08'], ['2030-12-05', '2030-12-25'],
];

const RULERS = [
  // weekday 0 = Sunday
  { planet: 'Sun', bias: { yes: 0.3 }, note: 'Sunday is ruled by the Sun: optimism is in the air.' },
  { planet: 'Moon', bias: { maybe: 0.35 }, note: 'Monday is ruled by the Moon: feelings over facts.' },
  { planet: 'Mars', temp: 0.8, note: 'Tuesday is ruled by Mars: answers come out sharper.' },
  { planet: 'Mercury', bias: { unsure: 0.2 }, note: 'Wednesday is ruled by Mercury: overthinking likely.' },
  { planet: 'Jupiter', bias: { yes: 0.45 }, note: 'Thursday is ruled by Jupiter: expansive, generous, yes-prone.' },
  { planet: 'Venus', bias: { maybe: 0.2, yes: 0.15 }, note: 'Friday is ruled by Venus: charming but noncommittal.' },
  { planet: 'Saturn', bias: { no: 0.45 }, note: 'Saturday is ruled by Saturn: strict, sober, no-prone.' },
];

const ELEMENTS = {
  fire: { temp: 0.8, note: 'Fire sign: decisive. Probabilities sharpened.' },
  earth: { bias: { maybe: -0.35, unsure: -0.2 }, note: 'Earth sign: practical. Less patience for "maybe".' },
  air: { bias: { maybe: 0.35 }, note: 'Air sign: sees every side. "Maybe" gets a boost.' },
  water: { temp: 1.25, bias: { unsure: 0.2 }, note: 'Water sign: intuitive and fluid. Probabilities softened.' },
};

const toDate = (d) => (d instanceof Date ? d : new Date(d));
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function sunSign(date) {
  const d = toDate(date), m = d.getMonth() + 1, day = d.getDate();
  let sign = SIGNS[0];
  for (const s of SIGNS) if (m > s[3] || (m === s[3] && day >= s[4])) sign = s;
  if (m === 12 && day >= 22) sign = SIGNS[0];
  const [name, glyph, element] = sign;
  return { name, glyph, element };
}

/** 'leo' / 'Leo' -> { name, glyph, element }. Throws on unknown names. */
export function signByName(name) {
  const s = SIGNS.find((x) => x[0].toLowerCase() === String(name).toLowerCase());
  if (!s) throw new Error(`Unknown sign: ${name}`);
  return { name: s[0], glyph: s[1], element: s[2] };
}

export function moonPhase(date) {
  const SYNODIC = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14); // a known new moon
  const age = ((((toDate(date).getTime() - ref) / DAY) % SYNODIC) + SYNODIC) % SYNODIC;
  const f = age / SYNODIC;
  const illumination = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  const glyphs = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  const i = Math.floor(f * 8 + 0.5) % 8;
  return { age: +age.toFixed(2), fraction: +f.toFixed(3), illumination: +illumination.toFixed(2), name: names[i], glyph: glyphs[i], waxing: f < 0.5 };
}

export function mercuryRetrograde(date) {
  const key = ymd(toDate(date));
  for (const [a, b] of MERCURY_RETROGRADE) if (key >= a && key <= b) return { retrograde: true, until: b };
  const last = MERCURY_RETROGRADE.at(-1);
  if (key > last[1]) {
    // beyond the table: Mercury's synodic period is ~115.88 days, retrograde lasts ~3 weeks
    const days = (toDate(date) - new Date(last[0])) / DAY;
    const phase = ((days % 115.88) + 115.88) % 115.88;
    if (phase < 22) return { retrograde: true, until: ymd(new Date(toDate(date).getTime() + (22 - phase) * DAY)), approximate: true };
  }
  return { retrograde: false };
}

// Opposite Day (January 25): yes means no and no means yes. Hardcoded, independent of the horoscope strength.
export const OPPOSITE_DAY = { month: 1, day: 25 };
export const isOppositeDay = (date = new Date()) => { const d = toDate(date); return d.getMonth() + 1 === OPPOSITE_DAY.month && d.getDate() === OPPOSITE_DAY.day; };
export const applyOppositeDay = (p) => ({ ...p, yes: p.no, no: p.yes });

/**
 * Compute today's astrological situation and the resulting nudge.
 * horoscope: optional free text ("Avoid red. Large numbers are unlucky.") whose omens replace the generated ones.
 * sign: a sun sign name ('Leo'), used when there is no birthday.
 */
export function readStars({ date = new Date(), birthday, sign: signName, horoscope } = {}) {
  const d = toDate(date);
  const notes = [];
  const bias = { yes: 0, no: 0, maybe: 0, unsure: 0 };
  let temp = 1;
  const addBias = (b = {}) => { for (const k in b) bias[k] += b[k]; };

  const sky = sunSign(d);
  const sign = birthday ? sunSign(birthday) : signName ? signByName(signName) : null;

  const merc = mercuryRetrograde(d);
  if (merc.retrograde) {
    addBias({ unsure: 0.8, yes: -0.2 });
    notes.push(`☿ Mercury is retrograde (until ${merc.until}${merc.approximate ? ', roughly' : ''}): nothing is certain, the model hedges.`);
  }

  const moon = moonPhase(d);
  if (moon.name === 'Full Moon') { addBias({ maybe: 0.5 }); notes.push(`${moon.glyph} Full Moon: emotions run high, "maybe" is stronger.`); }
  else if (moon.name === 'New Moon') { addBias({ unsure: 0.35 }); notes.push(`${moon.glyph} New Moon: a blank slate, little is visible.`); }
  else if (moon.waxing) { addBias({ yes: 0.2 }); notes.push(`${moon.glyph} ${moon.name}: a growing moon favours yes.`); }
  else { addBias({ no: 0.2 }); notes.push(`${moon.glyph} ${moon.name}: a shrinking moon favours no.`); }

  const ruler = RULERS[d.getDay()];
  addBias(ruler.bias); if (ruler.temp) temp *= ruler.temp;
  notes.push(ruler.note);

  if (sign) {
    const el = ELEMENTS[sign.element];
    addBias(el.bias); if (el.temp) temp *= el.temp;
    notes.push(`${sign.glyph} ${sign.name}. ${el.note}`);
  }

  // daily cosmic mood, seeded from sign + date: a small, stable random tilt
  const who = sign ? sign.name : 'everyone';
  const h = fnv1a(`${who}|${ymd(d)}`);
  const mood = [0, 1, 2, 3].map((i) => (((h >>> (i * 8)) & 0xff) / 255 - 0.5) * 0.6);
  LABELS.forEach((l, i) => (bias[l] += mood[i]));
  const moodScore = 1 + (h % 10);
  notes.push(`✨ Cosmic mood for ${who} today: ${moodScore}/10.`);

  const omens = horoscope ? parseOmens(horoscope) : dailyOmens(`omens|${who}|${ymd(d)}`, 3, d);
  for (const o of omens) notes.push(`${{ avoid: '⚠️', favour: '🍀', clouded: '🌫️' }[o.kind]} ${o.text}`);

  return { date: ymd(d), at: d, sky, sign, moon, mercury: merc, ruler: ruler.planet, bias, temperature: +temp.toFixed(3), mood: moodScore, omens, notes };
}

/**
 * Apply the stars to model probabilities.
 * strength 0 = pure model, 1 = full astrological influence (values above 1 work too, if you dare).
 * text: the sentence, needed for omens. omensApplied: the model already took the omens into account
 * (the decision model reads them), so only the mood is applied here.
 */
export function applyStars(probs, stars, strength = 0.5, { text, omensApplied = false } = {}) {
  if (!strength) return { ...probs };
  if (text && !omensApplied && stars.omens?.length) probs = applyOmens(probs, text, stars.omens, strength, stars.at).probs;
  const T = Math.pow(stars.temperature, strength);
  const logits = LABELS.map((l) => (Math.log(Math.max(probs[l], 1e-9)) + strength * stars.bias[l]) / T);
  const m = Math.max(...logits);
  const e = logits.map((x) => Math.exp(x - m));
  const s = e.reduce((a, x) => a + x, 0);
  return Object.fromEntries(LABELS.map((l, i) => [l, e[i] / s]));
}
