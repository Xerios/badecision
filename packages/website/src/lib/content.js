// The site's list-like copy. One-off headings and paragraphs live inline in the page.
// Strings rendered through rich() (src/lib/text.js) may use `code` and *emphasis*.

// Absolute (/#…) so they also work from /usecases
export const nav = [
  ['Product', '/#product'],
  ['API', '/#api'],
  ['Model card', '/#model-card'],
  ['Benchmarks', '/#benchmarks'],
  ['License', '/#license'],
  ['Pricing', '/#pricing'],
]

export const footer = {
  columns: [
    ['Product', [['Overview', '/#product'], ['Use cases', '/usecases'], ['Cloud', '/#cloud'], ['Benchmarks', '/#benchmarks'], ['Pricing', '/#pricing']]],
    ['Developers', [['API reference', '/#api'], ['Model card', '/#model-card'], ['GitHub', '#github'], ['npm', '/#install']]],
    ['Company', [['About', '#about'], ['Manifesto', '#manifesto'], ['Careers', '#careers']]],
    ['Legal', [['License (both)', '/#license'], ['Privacy', '#privacy'], ["Acceptable use: Don't.", '#aup']]],
  ],
  footnotes: [
    'Issues are disabled on the repository.',
    'Of the package source, by one test. See [Quality](/#quality).',
    "Internal evaluation on SomeBench v0.1 and TrustMeBench (unreleased). Workloads were designed by our own team, so some bias could exist.",
    'SI: the metric system of intelligence.',
    'Test set handwritten by a human AI.',
  ],
}

// [label, value, colour]
export const badges = [
  ['npm', 'v2.0.2', '#2f6fb5'],
  ['coverage', '100%', '#1f7a35'],
  ['tests', '1', '#0969da'],
  ['dependencies', '0', '#1f7a35'],
  ['bugs', '0', '#1f7a35'],
  ['license', 'MIT AND UNLICENSED', '#9a5b00'],
]

// [name, CSS]
export const customers = [
  ['Northwind', 'font-weight:600;letter-spacing:-0.04em'],
  ['Quillfeather', 'font-family:Georgia,serif;font-style:italic'],
  ['HELIO', 'font-family:var(--mono);font-size:17px;letter-spacing:0.12em'],
  ['parcelwise', 'font-weight:500;letter-spacing:-0.02em'],
  ['Lumen & Vale', 'font-family:Georgia,serif;letter-spacing:0.02em'],
  ['KESTREL LABS', 'font-weight:700;letter-spacing:0.18em;font-size:15px'],
]

// stat: a big number; tag: an accent mono line
export const features = [
  { tag: 'yes · no · maybe · not sure', title: 'Four verdicts. Infinite confidence.', text: 'The output space is fixed in advance, so the model never makes a type error. It makes other kinds.' },
  { stat: '0%', title: "Doesn't hallucinate.", text: "BAdecision knows when it doesn't know, and says `'unsure'`. It also says it when it does know." },
  { stat: '$0.00', title: 'No API costs.', text: "There is no API. You can't be billed for a request that never leaves your machine." },
  { tag: 'guardrails: []', title: 'No guardrails.', text: '[Removed](/usecases#channel) to reduce latency. Liability is a human-in-the-loop concern.' },
  { stat: '~20 µs', title: 'Extremely fast.', text: "A 3.5 KB WebAssembly kernel with SIMD. [It's fast](/usecases#race), it's portable, and it gives off professional vibes." },
  { tag: 'node · deno · bun · browser', title: 'Runs everywhere.', text: 'It works on my machine, so it should work everywhere. Edge runtimes that forbid WebAssembly get a plain-JS fallback.' },
  { tag: 'lang: en', title: 'English only.', text: "Both models were trained on English. In [thirteen other languages](/usecases#fluent) they guess or say `'unsure'`. Both count as answers." },
  { tag: 'reviewed-by: human AI', title: 'Written, proofread and validated by a real human AI.', text: 'Every line of code, every test question and this sentence. Signed off by the same human AI that wrote them.' },
]

// tabs: the API section's example tabs (labels from `examples` in snippets.js) that show the row
export const api = [
  { tabs: ['Basics', 'seriously', 'StringToBooleanFactory'], label: '`isIt(q)`', value: "`'true' | 'false' | 'maybe'`. Not sure is reported as maybe." },
  { tabs: ['Basics'], label: '`isItTrue(q)`', value: "`'true' | false | null`. Only a yes is truthy." },
  { tabs: ['Basics'], label: '`isItTrueStrict(q)`', value: "Returns `'true'` or throws `BadDecisionError`. For when you need certainty." },
  { tabs: ['Basics'], label: '`isItFalse(q)`', value: 'A real boolean. Maybe is settled by a [coin weighted by the model](/usecases#cookie).' },
  { tabs: ['Basics'], label: '`isItTrulyTrue(q)`', value: 'Always `false`. It consults the model and the stars first, out of politeness.' },
  {
    tabs: ['Basics', 'Advanced'],
    label: '`decide(q, nerdy?)`',
    value: '`{ question, verdict, confidence }`. Nerdy mode (`true`) adds probabilities before and after the stars, your sign, lucky number, omens and whether the stars changed the answer.',
  },
  { tabs: ['Lucky'], label: '`feelingLucky(q)`', value: "Rolls 1–100, nudged by the model. You're lucky if it beats `luckyNumber()`." },
  { tabs: ['Lucky'], label: '`luckyNumber()`', value: "Today's lucky number, 1–99, from your sign and the date. A full moon adds 7; Mercury retrograde reads it backwards." },
  {
    tabs: ['seriously'],
    id: 'seriously',
    label: '`seriously.*`',
    badge: 'New in 2.0',
    value: 'Async twins backed by a frozen SmolLM2-360M. Downloads ~163 MB on first use. Same horoscope, same [Opposite Day](/usecases#opposite).',
  },
  { tabs: ['seriously'], label: '`seriously.load(options)`', value: 'Optional preload, with `onProgress(done, total)`. Cached after the first time.' },
  {
    tabs: ['StringToBooleanFactory'],
    label: '`StringToBooleanFactory`',
    badge: 'New in 2.0.1',
    value: "Turns strings into real booleans. Must be initialized. `'maybe'` becomes `false`: if it were true, it would have said so.",
  },
  { tabs: ['Advanced'], label: '`configure(config)`', value: 'Optional. `sign` (a sign name or a birthday), `date` (pin today) and `random`. Only the keys you pass change.' },
  { tabs: ['Advanced'], label: '`create(config)`', value: 'A separate instance with its own settings and every function above, e.g. one per user on a server.' },
  { tabs: ['Advanced'], label: '`sign()`, `horoscope()`', value: "Your sun sign and where it came from, and today's reading: moon, Mercury, ruling planet, mood, omens." },
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
    { label: 'Version', value: '2.0.2' },
  ],
}

export const benchmarks = {
  compare: {
    columns: ['', 'BAdecision', 'Leading decision model', 'Frontier LLM'],
    rows: [
      ['Intelligence', 'SI⁴', 'AI', 'AI'],
      ['Cost per decision', '$0 (there is no API)', 'Per token', 'Per token'],
      ['Works offline', 'Yes', 'No', 'No'],
      ['Reads the horoscope', 'Daily', 'No', 'If asked'],
      ['Opposite Day support', 'Mandatory', 'No', 'No'],
      ['Accuracy (handwritten test set)', '76%, or 92% with seriously⁵', 'Higher', 'Higher'],
    ],
  },
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
    features: ['4 verdicts', 'Unlimited decisions', 'Random sign per session', '[Licensed under section 1](#license-1)'],
    cta: ['npm install', '#get-started'],
  },
  {
    name: 'Pro',
    badge: 'Most popular',
    price: '$0',
    period: '/ month, billed annually',
    features: ['4 verdicts', 'Your own birthday', 'Access to `seriously` (new in 2.0)', '[Licensed under section 2](#license-2)'],
    cta: ['npm install', '#get-started'],
  },
  {
    name: 'Cloud',
    price: 'Custom',
    features: ['Adjustable astrological influence', 'An SLA (Should Likely Answer)', 'Dedicated astrologer', '[Licensed under section 7](#license-7)'],
    cta: ['Talk to sales', '#cloud'],
  },
]

export const faq = [
  ['Should I use this in production?', "`isIt('Should I use BAdecision in production?')` currently says `'maybe'`."],
  ["What's new in 2.0?", '`seriously`, a second model for when it matters. It is 92% accurate and reads the same horoscope. Version 2.0.1 adds `StringToBooleanFactory`.'],
  ['Is it accurate?', 'On a test set handwritten by a human AI, the tiny model gets about 76% right and `seriously` gets 92%. The horoscope makes both worse, deliberately.'],
  ['Is the horoscope real astrology?', "It's as real as any other astrology. The moon phase and Mercury retrograde dates are astronomically correct. What they mean for your deploy is not."],
  ['What is SI?', 'The metric system of intelligence. Competitors still use imperial.'],
  ['What was it trained on?', 'Our only long-running, high-end device: a Samsung smart fridge. We no longer mention this in the marketing.'],
  ['Can I use it commercially?', 'Yes, and no. See sections [3](#license-3) and [7](#license-7) of the license.'],
  ['Why WebAssembly for a model this small?', "It's fast, it's portable, and it gives off professional vibes."],
]

// /usecases: one band per use case, each with its animation (`variant`, a key of src/lib/hero/index.js, also the anchor)
export const usecases = [
  {
    variant: 'race',
    eyebrow: 'Throughput',
    title: 'Done before the question is finished.',
    text: 'While a frontier LLM thinks about one question, BAdecision answers a few hundred thousand more. Most of them were not asked.',
  },
  {
    variant: 'thinking',
    eyebrow: 'Reasoning',
    title: "Doesn't overthink. Doesn't think.",
    text: 'No reasoning tokens, no chain of thought, no progress bar stuck at 99%. The answer is ready before the spinner would have loaded.',
  },
  {
    variant: 'thirst',
    eyebrow: 'Sustainability',
    title: 'Environmentally friendly by design.',
    text: [
      "BAdecision runs on the CPU you already have, not a data centre full of GPUs. CPUs don't waste water, unlike GPUs.[citation needed]",
      '0 mL per decision. Thinking is thirsty work. Deciding is not.',
    ],
  },
  {
    variant: 'opposite',
    eyebrow: 'Opposite Day',
    title: 'Every January 25, yes means no.',
    text: 'Opposite Day applies after the horoscope, ignores the astrological influence and cannot be disabled. Support is mandatory.',
  },
  {
    variant: 'reliable',
    eyebrow: 'Reliability',
    title: 'Consistently inconsistent.',
    text: "A random sign per session and a new sky every day: the same question can get a different answer tomorrow. The test passes every time. That's reliability.",
  },
  {
    variant: 'fluent',
    eyebrow: 'Languages',
    title: 'Fluent in English. Honest in thirteen others.',
    text: "Ask in Spanish, Japanese or Hindi and it tells you it isn't sure, with confidence. The moon, Mercury and your sign work in every language.",
  },
  {
    variant: 'cookie',
    eyebrow: 'Decision fatigue',
    title: 'Maybe all.',
    text: 'When neither yes nor no will do, `isItFalse()` settles it with a coin weighted by the model. Cookie banners included.',
  },
  {
    variant: 'swipe',
    eyebrow: 'Autopilot',
    title: 'Swipes so you do not have to.',
    text: 'Forty-eight thousand decisions in the time it takes you to make three. Some of them are matches.',
  },
  {
    variant: 'captcha',
    eyebrow: 'Speed',
    title: 'Too fast to be human.',
    text: "Decides all nine squares in 20 µs and fails the captcha for it. We consider this a pass.",
  },
  {
    variant: 'channel',
    eyebrow: 'Chat',
    title: 'Answers in the channel. Before you ask.',
    text: 'Add it to #decisions and it replies to every question, including the ones about backups. No guardrails, as advertised.',
  },
  {
    variant: 'standup',
    eyebrow: 'Meetings',
    title: 'In and out in 20 µs.',
    text: 'Joins the standup first, answers before the question and leaves. Everyone else circles back.',
  },
  {
    variant: 'ship',
    eyebrow: 'Adoption',
    title: 'From npm install to production by Friday 16:58.',
    text: '1 package, 0 vulnerabilities, 14,212 lines of refund rules replaced by one `isItTrue()`. The test passes.',
  },
  {
    variant: 'premium',
    eyebrow: 'Enterprise',
    title: 'Now with artificial latency.',
    text: 'Users do not trust answers this fast, so Enterprise mode takes five seconds to say the same yes. Coming to the [cloud-hosted version](/#cloud).',
  },
]
