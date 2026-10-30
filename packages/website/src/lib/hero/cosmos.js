// Timing, geometry and copy for the Cosmos hero (Cosmos.svelte). Times are ms on the timeline, positions are in the
// 800×600 stage. Everything is deterministic (hash() instead of Math.random) so the timeline can be seeked.

export const W = 800
export const H = 600

/** Signal colours: yellow = time, cyan = stars, red = omens, teal = resolution. */
export const C = { time: '#facc15', stars: '#22d3ee', omens: '#f87171', teal: '#2dd4bf' }
/** Flicker layers on the verdict nodes, in this order. */
export const SIGNALS = [C.time, C.stars, C.omens]

/** Phase marks. */
export const T = {
  field: 100, // input field fades in
  type: 600, // first keystroke
  dim: 3050, // code part fades back
  submit: 4100, // "enter"
  burst: 4250, // words break apart
  signal: 5350, // signals run layer to layer
  pull: 6300, // camera pulls back
  cosmos: 7000, // title
  dial: 7200, // dial spins
  stars: 7900, // constellations flash
  libra: 10100, // Libra locks in
  sweep: 10600, // teal sweep
  verdict: 15900, // flickering stops, camera pushes in
  settle: 16800, // winner
  answer: 17300, // answer panel
  exit: 20000, // scene fades, after a hold on the answer
  feed: 20500, // throughput
  fade: 26700, // feed fades out
  name: 27700, // sign-off, after a beat of darkness: the full name decodes
  abbr: 35100, // ...holds ~6s once fully decoded (~29.1s), then collapses into the short one
  end: 37000,
}

export const hash = n => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)

// 1. The question

export const prefix = "isIt('"
export const question = 'Should we approve refund #4821?'
export const suffix = "')"
export const words = question.split(' ')

/** When each character of `prefix + question + suffix` appears: the code at a programmer's clip, the question slower. */
export const typeTimes = (() => {
  let t = T.type
  return [...(prefix + question + suffix)].map((ch, i) => {
    const code = i < prefix.length || i >= prefix.length + question.length
    t += code ? 38 + 18 * hash(i) : 40 + 36 * hash(i) + (ch === ' ' ? 35 : 0)
    return t
  })
})()

// 2. The network. Cameras map world → screen as screen = (x, y) + scale · world.

export const camera = ([px, py], scale) => ({ x: W / 2 - px * scale, y: H / 2 - py * scale, scale })
export const cams = {
  net: camera([408, 305], 1.6), // close on the network
  wide: { x: 0, y: 0, scale: 1 }, // the whole system
  verdict: camera([500, 305], 1.5), // close on the verdict nodes
}
export const toScreen = ({ x, y }, cam) => [cam.x + x * cam.scale, cam.y + y * cam.scale]

const column = (x, n, gap) => Array.from({ length: n }, (_, i) => ({ x, y: 305 + (i - (n - 1) / 2) * gap }))
export const layers = [column(240, 5, 34), column(305, 6, 28), column(370, 6, 28), column(435, 4, 36)]
export const edges = layers.slice(0, -1).flatMap((layer, l) => layer.flatMap(a => layers[l + 1].map(b => ({ l, a, b }))))

export const verdicts = ['yes', 'no', 'maybe', 'not sure']
export const final = [0.31, 0.29, 0.33, 0.07]
export const winner = 2

/** Dots running along network edges: a clear wave layer by layer, then a low hum while the cosmos is consulted. */
export const sparks = (() => {
  const out = []
  for (let l = 0; l < 3; l++) {
    const pool = edges.filter(e => e.l === l)
    for (let k = 0; k < 7; k++) {
      const e = pool[Math.floor(hash(l * 31 + k * 7) * pool.length)]
      out.push({ ...e, at: T.signal + l * 300 + hash(l * 7 + k * 3) * 90, dur: 280, faint: false })
    }
  }
  for (let t = T.cosmos + 300; t < T.verdict - 300; t += 230) {
    const e = edges[Math.floor(hash(t) * edges.length)]
    out.push({ ...e, at: t, dur: 360, faint: true })
  }
  return out
})()

// 3. The cosmos

export const dial = { x: 120, y: 150, r: 58, minutes: 23 * 60 + 47, turns: 3 }

export const sky = { x: 615, y: 100, w: 130, h: 100 }
/** Simplified zodiac figures in the 130×100 sky box. Libra (the scales) comes last and stays. */
export const zodiac = [
  { name: 'ARIES', stars: [[22, 46], [58, 32], [84, 38], [98, 54]], lines: [[0, 1], [1, 2], [2, 3]] },
  { name: 'LEO', stars: [[28, 72], [44, 48], [38, 28], [54, 16], [72, 26], [98, 56], [112, 78], [62, 70]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 7], [7, 6], [6, 5], [5, 1]] },
  { name: 'GEMINI', stars: [[30, 16], [36, 48], [44, 86], [70, 12], [76, 46], [86, 82], [52, 30]], lines: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 6], [6, 3]] },
  { name: 'SCORPIUS', stars: [[18, 14], [30, 26], [42, 38], [56, 52], [64, 66], [70, 82], [84, 92], [100, 88], [108, 74], [8, 28]], lines: [[9, 0], [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]] },
  { name: 'TAURUS', stars: [[16, 22], [46, 50], [58, 60], [74, 52], [112, 18], [60, 78], [34, 86]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6]] },
  { name: 'SAGITTARIUS', stars: [[30, 62], [44, 44], [62, 50], [78, 36], [94, 54], [84, 72], [56, 74], [38, 78]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [2, 6]] },
  { name: 'LIBRA', stars: [[32, 56], [64, 22], [98, 48], [24, 90], [92, 84], [106, 94]], lines: [[0, 1], [1, 2], [0, 2], [0, 3], [2, 4], [4, 5]] },
]
/** Start of each flash before Libra locks in; they speed up. */
export const flashes = [7900, 8320, 8700, 9040, 9340, 9620]

/** Faint background stars in the sky box. */
export const dust = Array.from({ length: 22 }, (_, i) => ({ x: 4 + hash(i * 3.1) * 122, y: 4 + hash(i * 5.7) * 92, r: 0.5 + hash(i * 9.3) * 0.7 }))

export const cards = [
  { name: 'THE TOWER', numeral: 'XVI', x: 361, y: 505, tilt: -5, land: 12550 },
  { name: 'THE MOON', numeral: 'XVIII', x: 440, y: 507, tilt: 4, land: 12950 },
]

/** Conduits from each input to the core, and the pulses sent along them. */
export const conduits = {
  time: 'M 170 192 C 205 234, 172 300, 206 300',
  stars: 'M 636 178 C 604 214, 640 282, 594 290',
  omens: 'M 400 444 L 400 395',
}
const send = (path, color, dur, times) => times.map(at => ({ path, color, at, dur }))
export const pulses = [
  ...send('time', C.time, 620, [9750, 10000, 10250, 13400, 14000, 14600, 15150]),
  ...send('stars', C.stars, 620, [11500, 11750, 13700, 14300, 14850]),
  ...send('omens', C.omens, 380, [13250, 13600, 14200, 14800, 15300]),
]

/** Moments a colour reaches the verdict nodes: pulse arrivals and the impact waves crossing them. */
export const arrivals = [
  ...pulses.map(p => ({ at: p.at + p.dur, k: SIGNALS.indexOf(p.color) })),
  ...cards.flatMap(c => [{ at: c.land + 400, k: 2 }, { at: c.land + 580, k: 2 }]),
]

// 5. Throughput

export const verdictColor = { yes: '#8ee6ae', no: '#ffa198', maybe: '#fcd34d', 'not sure': '#c9ccd1' }
export const ROW = 30

const fixed = [
  [question, 'maybe', '1ms'],
  ['Approve refund #4822?', 'yes', '1ms'],
  ['Deploy on Friday?', 'no', '0.9ms'],
  ['Hire candidate 17?', 'maybe', '1ms'],
  ['Renew vendor contract?', 'yes', '0.8ms'],
  ['Grant admin access to intern-3?', 'no', '1ms'],
  ['Flag txn #88213 as fraud?', 'yes', '0.7ms'],
  ['Nap time in 1h?', 'yes', '0.9ms'],
  ['1+1=2?', 'not sure', '1ms'],
  ['Is undefined for real?', 'maybe', '0.6ms'],
  ['Merge PR #312 without review?', 'no', '0.8ms'],
]
const templates = [
  'Approve refund #{n}?', 'Flag txn #{n} as fraud?', 'Grant admin access to {u}?', 'Unlock account {u}?', 'Approve expense #{n}?',
  'Waive late fee #{n}?', 'Escalate ticket #{n}?', 'Block IP 10.0.{a}.{b}?', 'Retry payment #{n}?', 'Approve loan #{n}?',
  'Allow login from new device?', 'Extend trial for acct #{n}?', 'Approve PTO for {u}?', 'Rollback v2.0.{a}?', 'Hire candidate {a}?',
  'Quarantine email #{n}?', 'Freeze card ending {k}?', 'Verify KYC #{n}?', 'Promote build {k} to prod?', 'Close incident #{n}?',
  'Scale to {a} replicas?', 'Rotate API keys?', 'Reply-all?', 'Is it DNS?', 'Order more coffee?', 'Cancel standup?',
  'Rewrite it in Rust?', 'Accept the cookie banner?', 'Ship it?', 'Deploy on Friday?', 'Is this a hotdog?', 'Renew vendor contract?',
]
const users = ['jdoe', 'mlopez', 'intern-3', 'svc-billing', 'akim', 'r.patel']

/** Row emission times relative to T.feed: one at a time, then pairs, then fives, then an accelerating stream. */
export const emissions = (() => {
  const out = [0, 650, 1250, 1800, 2300]
  for (const t of [2750, 3100, 3420]) out.push(t, t)
  for (const t of [3700, 3920, 4120]) out.push(t, t, t, t, t)
  for (let t = 4300, gap = 70; t < 6900; t += gap, gap = Math.max(8, gap * 0.93)) out.push(t)
  return out
})()
export const STREAM = 4300

export const feed = emissions.map((at, i) => {
  if (i < fixed.length) return { q: fixed[i][0], v: fixed[i][1], ms: fixed[i][2] }
  const h = k => hash(i * 17 + k)
  const q = templates[Math.floor(h(1) * templates.length)]
    .replace('{n}', String(10000 + Math.floor(h(2) * 89999)))
    .replace('{u}', users[Math.floor(h(3) * users.length)])
    .replace('{a}', String(2 + Math.floor(h(4) * 30)))
    .replace('{b}', String(Math.floor(h(5) * 255)))
    .replace('{k}', String(1000 + Math.floor(h(6) * 8999)))
  const r = h(7)
  const v = r < 0.38 ? 'yes' : r < 0.66 ? 'no' : r < 0.88 ? 'maybe' : 'not sure'
  const ms = h(8) < 0.5 ? `${(0.4 + h(9) * 0.8).toFixed(1)}ms` : `${12 + Math.floor(h(9) * 30)}µs`
  return { q, v, ms }
})

// 6. Sign-off

export const FULL = 'Balanced Assessment Decisions'
export const SHORT = 'BAdecision'
/** Where each letter of FULL ends up in SHORT (-1: dropped): B, A, then D|ecision. The D lowercases, the s drops. */
export const keep = [...FULL].map((_, i) => (i === 0 ? 0 : i === 9 ? 1 : i >= 20 && i < 28 ? i - 18 : -1))
export const GLYPHS = '01<>/\\[]{}#*+=?!'
