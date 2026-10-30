// The badecision package's default instance (packages/badecision/src: config.ts, lucky.ts, answers.ts, tiny.ts),
// rebuilt over @badecision/core for the playground. Same sign handling, lucky number and decide() output. The
// package inlines its weights and runs them in WebAssembly; here the tiny model is fetched once and runs in JS.
// `seriously` (serious.ts) is the same front processor, kernel, head and Cache API cache as the package's.

import { TinyModel } from '@badecision/core/model'
import { makeDecider } from '@badecision/core/decider'
import { fnv1a } from '@badecision/core/features'
import { SIGNS, signOf, isSignName, moonPhase, mercuryRetrograde } from '@badecision/core/horoscope'
import { loadSmol, makeHead, SMOL } from '@badecision/core/smol'
import MODEL_URL from '@badecision/core/models/tiny/model.bin?url'
import HEAD_URL from '@badecision/core/models/serious/head.json?url'
import KERNEL_URL from '../../../badecision/kernel/smol_kernel.wasm?url' // the package's committed kernel

const ASTRO = 0.5 // fixed, as in the package ("only in the cloud-hosted version")
const SESSION_KEY = 'badecision:sign' // the package's key, so the playground and the package agree on a tab's sign

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function sessionSign() {
  let name
  try {
    name = sessionStorage.getItem(SESSION_KEY)
  } catch {}
  if (!SIGNS.some(s => s[0] === name)) {
    name = SIGNS[Math.floor(Math.random() * SIGNS.length)][0]
    try {
      sessionStorage.setItem(SESSION_KEY, name)
    } catch {}
  }
  return name
}

async function fetchBytes(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.arrayBuffer()
}

const f32 = b64 => new Float32Array(Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer)

// serious.ts rangeFetcher(), browser branch: same cache name and keys, so the package on this origin reuses the download.
// Bodies are streamed so onBytes(n) can report progress inside one large range (loadSmol reports per range only).
function rangeFetcher(onBytes) {
  const key = `${SMOL.revision}-${SMOL.file}`
  const download = async (start, end) => {
    const res = await fetch(SMOL.url, { headers: { Range: `bytes=${start}-${end - 1}` } })
    if (res.status !== 206 && !(res.status === 200 && start === 0)) throw new Error(`Downloading the serious model failed: HTTP ${res.status}`)
    const out = new Uint8Array(end - start)
    const reader = res.body.getReader()
    let at = 0
    while (at < out.length) {
      const { done, value } = await reader.read()
      if (done) throw new Error(`Downloading the serious model failed: got ${at} of ${out.length} bytes`)
      const n = Math.min(value.length, out.length - at)
      out.set(value.subarray(0, n), at)
      at += n
      onBytes(n)
    }
    reader.cancel().catch(() => {}) // a 200 sends the whole file; we only wanted the start
    return out.buffer
  }
  return async (start, end) => {
    const req = `https://badecision.cache/${key}/${start}-${end}`
    try {
      const c = await caches.open('badecision')
      const hit = await c.match(req)
      if (hit) {
        const buf = await hit.arrayBuffer()
        onBytes(buf.byteLength)
        return buf
      }
      const buf = await download(start, end)
      await c.put(req, new Response(buf)).catch(() => {})
      return buf
    } catch {
      return download(start, end)
    }
  }
}

/** Fetch the tiny model; resolves to { configure, sign, luckyNumber, decide, seriously }, like `import * from 'badecision'`. */
export async function loadBadecision() {
  const decider = makeDecider(TinyModel.fromArrayBuffer(await fetchBytes(MODEL_URL)))
  let serious = null
  const random = sessionSign()
  let chosen = null

  /** Only `sign` is supported here: a sign name or a birthday, `null` for the session's random sign. */
  function configure({ sign }) {
    if (sign != null) signOf(sign) // throws on anything that is neither a sign nor a date
    chosen = sign
  }

  function sign() {
    if (chosen != null) return { ...signOf(chosen), source: isSignName(chosen) ? 'chosen' : 'birthday' }
    return { ...signOf(random), source: 'random' }
  }

  function luckyNumber(date = new Date()) {
    let n = (fnv1a(`lucky|${sign().name}|${ymd(date)}`) % 99) + 1
    if (moonPhase(date).name === 'Full Moon') n = ((n + 6) % 99) + 1
    if (mercuryRetrograde(date).retrograde) n = Number(String(n).split('').reverse().join(''))
    return n
  }

  function decisionOf(decider, engine, question, nerdy) {
    const s = sign()
    const date = new Date()
    const r = decider.decide(String(question), { astro: ASTRO, sign: s.name, date })
    const decision = { question: r.text, verdict: r.verdict, confidence: r.confidence }
    if (!nerdy) return decision
    return {
      ...decision,
      probs: r.probs,
      model: r.model,
      sign: s,
      luckyNumber: luckyNumber(date),
      date: ymd(date),
      oppositeDay: r.oppositeDay,
      starsChangedIt: Boolean(r.starsChangedIt),
      omenHits: r.omenHits,
      notes: r.stars.notes,
      engine,
    }
  }

  const decide = (question, nerdy = false) => decisionOf(decider, 'js', question, nerdy)

  // like the package's seriously.load(): one shared load, retried after a failure. onProgress(done, total) in bytes of
  // weights; it starts once the GGUF header has been read and the total is known.
  function load(onProgress = () => {}) {
    serious ??= (async () => {
      const [kernel, head] = await Promise.all([fetchBytes(KERNEL_URL), fetchBytes(HEAD_URL).then(b => JSON.parse(new TextDecoder().decode(b)))])
      let done = 0
      let total = 0
      const fetchRange = rangeFetcher(n => {
        done += n
        if (total) onProgress(Math.min(done, total), total)
      })
      const start = (_, t) => {
        if (total) return
        total = t
        done = 0 // the header bytes don't count
        onProgress(0, t)
      }
      const smol = await loadSmol({ fetchRange, kernel, onProgress: start })
      const probs = makeHead({ ...head, mu: f32(head.mu), sd: f32(head.sd), W1: f32(head.W1), b1: f32(head.b1), W2: f32(head.W2), b2: f32(head.b2) })
      return makeDecider({ predict: text => probs(smol.hidden(text)) })
    })()
    serious.catch(() => (serious = null))
    return serious
  }

  const seriously = {
    load,
    async decide(question, nerdy = false) {
      return decisionOf(await load(), 'serious', question, nerdy)
    },
  }

  return { configure, sign, luckyNumber, decide, seriously }
}
