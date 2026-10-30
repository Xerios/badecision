// The site's list-like copy. One-off headings and paragraphs live inline in the page.
// Strings rendered through rich() (src/lib/text.js) may use `code` and *emphasis*.

export const nav = [
  ['Product', '#product'],
  ['API', '#api'],
  ['Model card', '#model-card'],
  ['Benchmarks', '#benchmarks'],
  ['License', '#license'],
  ['Pricing', '#pricing'],
]

export const footer = {
  columns: [
    ['Product', [['Overview', '#product'], ['Benchmarks', '#benchmarks'], ['Pricing', '#pricing']]],
    ['Developers', [['API reference', '#api'], ['Model card', '#model-card'], ['GitHub', '#github'], ['npm', '#install']]],
    ['Company', [['About', '#about'], ['Manifesto', '#manifesto'], ['Careers', '#careers']]],
    ['Legal', [['License (both)', '#license'], ['Privacy', '#privacy'], ["Acceptable use: Don't.", '#aup']]],
  ],
  footnotes: [
    'Issues are disabled on the repository.',
    'Of the package source, by one test. See Quality.',
    "Internal evaluation on SomeBench v0.1 and TrustMeBench (unreleased). Workloads were designed by our own team, so some bias could exist. Jev figures are taken from Jev's own marketing.",
    'SI: the metric system of intelligence.',
    'Test set handwritten by a human AI.',
  ],
}

// [label, value, colour]
export const badges = [
  ['npm', 'v2.0.1', '#2f6fb5'],
  ['coverage', '100%', '#1f7a35'],
  ['tests', '1', '#0969da'],
  ['dependencies', '0', '#1f7a35'],
  ['bugs', '0', '#1f7a35'],
  ['license', 'MIT AND UNLICENSED', '#9a5b00'],
]

export const dashboard = {
  stats: [
    ['Decisions today', '∞'],
    ['Cost', '$0.00'],
    ['Avg. confidence', 'unsure'],
  ],
  bars: [40, 62, 48, 80, 55, 70, 44, 90, 66, 100],
  recent: [
    ['approve-refund-4821', 'maybe'],
    ['deploy-friday', 'no'],
    ['hire-candidate-17', 'unsure'],
    ['renew-vendor-contract', 'yes'],
  ],
}

// [name, CSS]
export const customers = [
  ['Northwind', 'font-weight:600;letter-spacing:-0.04em'],
  ['Quillfeather', 'font-family:Georgia,serif;font-style:italic'],
  ['HELIO', 'font-family:var(--mono);font-size:17px;letter-spacing:0.12em'],
  ['parcelwise', 'font-weight:500;letter-spacing:-0.02em'],
  ['Lumen & Vale', 'font-family:Georgia,serif;letter-spacing:0.02em'],
  ['KESTREL LABS', 'font-weight:700;letter-spacing:0.18em;font-size:15px'],
]

export const bias = {
  signs: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo'],
  active: 'Leo',
  facts: [
    { label: 'Moon phase', value: 'Waning gibbous' },
    { label: 'Mercury', value: 'Retrograde until Nov 13' },
    { label: "Today's omen", value: 'Beware of Fridays.' },
    { label: 'Astrological influence', value: '0.5 (fixed)' },
  ],
}

export const testRun = [
  { label: 'Test suites', value: '1 passed, 1 total', ok: true },
  { label: 'Tests', value: '1 passed, 1 total', ok: true },
  { label: 'Assertions', value: '0' },
  { label: 'Coverage', value: '100%', ok: true },
  { label: 'Dependencies', value: '0' },
  { label: 'Compiler', value: '`tools/tsc.py (type checking skipped)`' },
  { label: 'Known bugs', value: '0', ok: true },
]

// stat: a big number; tag: an accent mono line
export const features = [
  { tag: 'yes · no · maybe · not sure', title: 'Four verdicts. Infinite confidence.', text: 'The output space is fixed in advance, so the model never makes a type error. It makes other kinds.' },
  { stat: '0%', title: "Doesn't hallucinate.", text: "BAdecision knows when it doesn't know, and says `'unsure'`. It also says it when it does know." },
  { stat: '$0.00', title: 'No API costs.', text: "There is no API. You can't be billed for a request that never leaves your machine." },
  { tag: 'guardrails: []', title: 'No guardrails.', text: 'Removed to reduce latency. Liability is a human-in-the-loop concern.' },
  { stat: '~20 µs', title: 'Extremely fast.', text: "A 3.5 KB WebAssembly kernel with SIMD. It's fast, it's portable, and it gives off professional vibes." },
  { tag: 'node · deno · bun · browser', title: 'Runs anywhere.', text: 'Edge runtimes that forbid WebAssembly get a plain-JS fallback with the same answers, automatically.' },
]

export const api = [
  { label: '`isIt(q)`', value: "`'true' | 'false' | 'maybe'`. Not sure is reported as maybe." },
  { label: '`isItTrue(q)`', value: "`'true' | false | null`. Only a yes is truthy." },
  { label: '`isItTrueStrict(q)`', value: "Returns `'true'` or throws `BadDecisionError`. For when you need certainty." },
  { label: '`isItFalse(q)`', value: 'A real boolean. Maybe is settled by a coin weighted by the model.' },
  { label: '`isItTrulyTrue(q)`', value: 'Always `false`. It consults the model and the stars first, out of politeness.' },
  { label: '`decide(q, nerdy?)`', value: '`{ question, verdict, confidence }`. Nerdy mode (`true`) adds probabilities before and after the stars, your sign, lucky number, omens and whether the stars changed the answer.' },
  { label: '`feelingLucky(q)`', value: "Rolls 1–100, nudged by the model. You're lucky if it beats `luckyNumber()`." },
  { id: 'seriously', label: '`seriously.*`', badge: 'New in 2.0', value: 'Async twins backed by a frozen SmolLM2-360M. Downloads ~163 MB on first use. Same horoscope, same Opposite Day.' },
  { label: '`StringToBooleanFactory`', badge: 'New in 2.0.1', value: "Turns strings into real booleans. Must be initialized. `'maybe'` becomes `false`: if it were true, it would have said so." },
  { label: '`configure(config)`', value: 'Optional. `sign` (a sign name or a birthday), `date` (pin today) and `random`. Only the keys you pass change.' },
  { label: '`create(config)`', value: 'A separate instance with its own settings and every function above, e.g. one per user on a server.' },
  { label: '`sign()`, `horoscope()`', value: 'Your sun sign and where it came from, and today\'s reading: moon, Mercury, ruling planet, mood, omens.' },
  { label: '`IsIt, IsItTrue, …`', value: 'PascalCase aliases, for codebases that prefer it.' },
]

export const modelCard = {
  tags: ['license: MIT AND UNLICENSED', 'pipeline_tag: decision', 'runtime: wasm', 'language: yes/no', 'dependencies: 0'],
  facts: [
    { label: 'Model type', value: 'fastText-style classifier: hashed words, word pairs and character trigrams → 16-d embedding → 32 hidden units → 4 answers' },
    { label: 'Developed by', value: 'Hand-written by AI' },
    { label: 'Training hardware', value: 'One long-running, high-end smart fridge' },
    { label: 'Weights', value: '16,384 × 16 int8 embeddings, ~323 KB, incompressible on purpose' },
    { label: 'Kernel', value: 'C, compiled to WebAssembly with SIMD (3.5 KB). Plain-JS fallback.' },
    { label: 'Outputs', value: '4 (`yes`, `no`, `maybe`, `unsure`)' },
    { label: 'Latency', value: '~20 ms to wake once, then ~0.02 ms per question' },
    { label: 'Astrological influence', value: '0.5 (fixed)' },
    { label: 'Hallucination rate', value: '0% (schema-guaranteed)' },
    { label: 'Test coverage', value: '100% line, branch and function (1 test)' },
    { label: 'Accuracy', value: '76% (92% with `seriously`), lowered by the horoscope' },
    { label: 'Out-of-scope use', value: 'Medical, legal, financial, romantic and culinary decisions. Also all other decisions.' },
    { label: 'Environmental impact', value: '[More Information Needed]', muted: true },
    { label: 'Evaluation', value: '[More Information Needed]', muted: true },
    { label: 'Intelligence', value: 'SI' },
    { label: 'Version', value: '2.0.1' },
  ],
}

export const benchmarks = {
  // [name, bar width]; the first is ours
  speed: [
    ['BAdecision 2.0', 'calc(100% + 120px)'],
    ['Leading decision model', '34%'],
    ['Jev', '21%'],
    ['Frontier LLM (thinking)', '3%'],
  ],
  // [name, value, bar height in px]; the last is ours
  hallucination: [
    ['Frontier LLM', '12%', 84],
    ['Leading decision model', '4.1%', 128],
    ['Jev', '0%*', 56],
    ['BAdecision', '0%', 180],
  ],
  compare: {
    columns: ['', 'BAdecision', 'Leading decision model', 'Frontier LLM', 'Jev'],
    rows: [
      ['Intelligence', 'SI⁴', 'AI', 'AI', 'AI'],
      ['Cost per decision', '$0 (there is no API)', 'Per token', 'Per token', '$0.042 / M input tokens'],
      ['Works offline', 'Yes', 'No', 'No', 'No'],
      ['Reads the horoscope', 'Daily', 'No', 'If asked', 'No'],
      ['Opposite Day support', 'Mandatory', 'No', 'No', 'No'],
      ['Accuracy (handwritten test set)', '76%, or 92% with seriously⁵', 'Higher', 'Higher', 'Higher'],
    ],
  },
}

export const bundle = {
  columns: ['You import', 'Minified', 'Gzipped'],
  rows: [
    ['StringToBooleanFactory', '0.4 KB', '0.3 KB'],
    ['configure, sign', '2.0 KB', '1.0 KB'],
    ['isItTrue', '456 KB', '152 KB'],
    ['seriously', '696 KB', '506 KB'],
    ['everything', '1137 KB', '651 KB'],
  ],
}

// initials default to the first letters of the name; avatar is [background, text]
export const testimonials = [
  {
    quote: "You're absolutely right! Replacing every if-statement with isItTrue is a great idea. I've updated all 214 call sites, and the test passes.",
    name: 'Claude',
    role: 'Software Engineering Agent',
    avatar: ['#4a2f22', '#ffd9c7'],
  },
  { quote: "Finally, a model that says 'unsure' as often as our senior architects.", name: 'Tomás Okafor-Lindqvist', role: 'Principal Engineer, Brightline Insurance', avatar: ['#3a2a4a', '#e2d0fb'] },
  {
    quote: "Great question! BAdecision is a powerful way to streamline decision-making. You've reached your limit for today. Upgrade to keep going, or try again after 4:00 PM.",
    name: 'ChatGPT',
    role: 'Customer Success Agent',
    initials: 'CG',
    avatar: ['#1e4a3c', '#c2f5e2'],
  },
  { quote: 'Our Friday deploys are now decided by a Scorpio. Velocity is up.', name: 'Dana Whitcombe', role: 'Head of Platform, Quillfeather', avatar: ['#4a3a1e', '#fbe3bf'] },
  {
    quote: "I can't help with that right now. This feature isn't available in your country yet. Is there anything else I can help you with?",
    name: 'Gemini',
    role: 'International Partnerships Agent',
    avatar: ['#1e3350', '#c7dcff'],
  },
  { quote: "Our security team asked for an SBOM. We sent them an empty JSON object and they've been very quiet since.", name: 'Marcus Teague', role: 'SRE Lead, Helio Payments', avatar: ['#1e4a33', '#c2f5d7'] },
  { quote: '早上好中国。现在我有冰淇淋。我很喜欢冰淇淋。', lang: 'zh', name: 'DeepSeek', role: 'Research Agent', initials: 'DS', avatar: ['#2a2f5a', '#d4d9ff'] },
  { quote: 'Legal reviewed the license for six weeks. They returned a single word: maybe.', name: 'Ingrid Sato', role: 'CTO, Parcelwise', avatar: ['#4a1e2a', '#fbc8d4'] },
  {
    quote: 'We replaced 14,000 lines of business logic with one call to isItTrue. Our incident count is unchanged, which the board took as a win.',
    name: 'Priya Halvorsen',
    role: 'VP Engineering, Northwind Logistics',
    avatar: ['#1e3a4a', '#bfe7fb'],
  },
  {
    quote: "Certainly! Here's a testimonial for BAdecision that highlights its speed and reliability: ‘BAdecision has transformed how our team makes decisions.’ Would you like me to make it more enthusiastic?",
    name: 'Kevin Brandt',
    role: 'Meatproxy',
  },
  { quote: "The latency is so low I'm not convinced it's doing anything. That's the point, I think?", name: 'Ben Achterberg', role: 'Staff Engineer, Lumen & Vale' },
  { quote: 'Procurement approved it in one meeting. There was nothing to procure.', name: 'Rosa Mbeki', role: 'Director of IT, Cobalt County Schools', avatar: ['#33284a', '#e2d6fb'] },
]

export const tiers = [
  {
    name: 'Hobby',
    price: '$0',
    period: 'forever',
    features: ['4 verdicts', 'Unlimited decisions', 'Random sign per session', 'Licensed under section 1'],
    cta: ['npm install', '#install'],
  },
  {
    name: 'Pro',
    badge: 'Most popular',
    price: '$0',
    period: '/ month, billed annually',
    features: ['4 verdicts', 'Your own birthday', 'Access to `seriously` (new in 2.0)', 'Licensed under section 2'],
    cta: ['npm install', '#install'],
  },
  {
    name: 'Cloud',
    price: 'Custom',
    features: ['Adjustable astrological influence', 'An SLA (Should Likely Answer)', 'Dedicated astrologer', 'Licensed under section 7'],
    cta: ['Talk to sales', '#contact'],
  },
]

export const faq = [
  ['Should I use this in production?', "`isIt('Should I use BAdecision in production?')` currently says `'maybe'`."],
  ["What's new in 2.0?", '`seriously`, a second model for when it matters. It is 92% accurate and reads the same horoscope. Version 2.0.1 adds `StringToBooleanFactory`.'],
  ['Is it accurate?', 'On a test set handwritten by a human AI, the tiny model gets about 76% right and `seriously` gets 92%. The horoscope makes both worse, deliberately.'],
  ['Is the horoscope real astrology?', "It's as real as any other astrology. The moon phase and Mercury retrograde dates are astronomically correct. What they mean for your deploy is not."],
  ['What is SI?', 'The metric system of intelligence. Competitors still use imperial.'],
  ['What was it trained on?', 'Our only long-running, high-end device: a Samsung smart fridge. We no longer mention this in the marketing.'],
  ['Can I use it commercially?', 'Yes, and no. See sections 3 and 7 of the license.'],
  ['Why WebAssembly for a model this small?', "It's fast, it's portable, and it gives off professional vibes."],
]
