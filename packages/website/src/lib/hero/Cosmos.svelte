<!--
  Hero animation "Cosmos": a question goes in, the network weighs time, stars and omens, settles on a verdict, then the
  same thing happens a few million more times and the name resolves. ~29.5s, plays once, holds the last frame.

  One anime.js timeline drives everything. Tweens move elements (transforms, opacity, SVG attributes); things that are
  easier as a function of time (typing, flicker, scores, the feed, the decoding name) are $derived from `now`, the
  timeline's current time, so the whole piece stays seekable. Copy, timing and geometry live in cosmos.js.
-->
<script>
  import { onMount } from 'svelte'
  import { createTimeline, createDrawable, createMotionPath, stagger, utils, eases } from 'animejs'
  import {
    W, C, SIGNALS, T, hash, clamp01, prefix, question, suffix, words, typeTimes, cams, toScreen, layers, edges, sparks, verdicts, final, winner,
    dial, sky, zodiac, flashes, dust, cards, conduits, pulses, arrivals, feed, emissions, STREAM, ROW, verdictColor, FULL, SHORT, keep, GLYPHS,
  } from './cosmos.js'

  /** still: jump to the final frame (reduced motion). onend: called once the last frame is reached. */
  let { still = false, onend } = $props()

  const uid = $props.id()
  let root
  let ready = $state(false)
  let now = $state(0)
  let dialDeg = $state(0)
  const dialState = { deg: 0 } // tweened by anime, read on every update

  // 1. typing
  let n = 0
  const segment = (text, kind) => ({ kind, chars: [...text].map(ch => ({ ch, i: n++ })) })
  const segments = [segment(prefix, 'code'), ...words.flatMap((w, k) => (k ? [segment(' ', 'gap'), segment(w, 'word')] : [segment(w, 'word')])), segment(suffix, 'code')]
  const typed = $derived(typeTimes.filter(t => t <= now).length)
  const caretOn = $derived(now < T.submit && ((now > typeTimes[0] - 120 && now < typeTimes.at(-1) + 250) || Math.floor(now / 530) % 2 === 0))

  // 3. dial readout, from the hand's angle
  const readout = $derived.by(() => {
    const m = Math.round(((((dialDeg % 360) + 360) % 360) / 360) * 1440) % 1440
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  })

  // verdict nodes: flicker per signal colour, strongest colour, swaying scores
  const flick = $derived.by(() => {
    const out = verdicts.map(() => SIGNALS.map(() => 0))
    if (now < T.cosmos || now > T.verdict + 300) return out
    const fade = clamp01((T.verdict + 300 - now) / 300)
    for (const a of arrivals) {
      for (let i = 0; i < out.length; i++) {
        const dt = now - a.at - hash(a.at + i) * 120
        if (dt < 0 || dt > 600) continue
        const v = Math.exp(-dt / 170) * (dt < 200 && Math.floor(dt / 45) % 2 ? 0.3 : 1) * fade
        if (v > out[i][a.k]) out[i][a.k] = v
      }
    }
    return out
  })
  const hot = $derived(flick.map(f => Math.max(...f)))
  const hotColor = $derived(flick.map(f => SIGNALS[f.indexOf(Math.max(...f))]))
  const scores = $derived.by(() => {
    if (now < T.pull) return null
    const f = flick
    const w = verdicts.map((_, i) => 1 + 0.35 * Math.sin(now / 170 + i * 2.1) + 0.25 * Math.sin(now / 67 + i * 4.3))
    w[0] += f[0][0] * 0.9 // time favours yes
    w[1] += f[1][2] * 0.9 // omens favour no
    w[2] += f[2][1] * 0.9 // the stars favour maybe
    w[3] += f[3][2] * 0.5
    const sum = w.reduce((a, b) => a + b, 0)
    const k = eases.inOutCubic(clamp01((now - T.verdict) / (T.settle - T.verdict)))
    return w.map((v, i) => (v / sum) * (1 - k) + final[i] * k)
  })
  const resolved = $derived(now >= T.settle)

  // 5. the feed: S(t) rows scrolled, each emission easing in over its own duration
  const nextGap = emissions.map(e => (emissions.find(x => x > e) ?? e + 400) - e)
  const scrollDur = nextGap.map(g => Math.min(340, Math.max(60, g * 1.6)))
  const reveal = nextGap.map((g, i) => (i === 0 ? 0 : Math.min(300, g * 0.6))) // the "considering" beat
  const ease3 = p => 1 - (1 - p) ** 3
  const scrollAt = t => {
    let s = 0
    for (let i = 0; i < emissions.length && emissions[i] <= t; i++) s += ease3(clamp01((t - emissions[i]) / scrollDur[i]))
    return s
  }
  const feedOn = $derived(now >= T.feed && now < T.name)
  const ft = $derived(now - T.feed)
  const emitted = $derived(feedOn ? emissions.filter(e => e <= ft).length : 0)
  const scroll = $derived(feedOn ? scrollAt(ft) : 0)
  const blur = $derived(feedOn ? Math.min(2.5, Math.max(0, (((scroll - scrollAt(ft - 16)) * ROW) / 16 - 1) * 1.5)) : 0)
  const count = $derived(emitted + Math.floor(10 ** (6.6 * clamp01((ft - STREAM) / (T.fade + 600 - T.feed - STREAM)) ** 1.6)) - 1)
  const rowOpacity = age => (age < 0 ? Math.max(0, age + 1) : Math.max(0.3, 1 - age * 0.07))

  // 6. the full name decodes letter by letter; the letters that will go dim, then fold away while the kept ones slide
  // together (x in ch from the centre) and the word grows into the short name
  const io = eases.inOutCubic
  const nameScale = $derived(0.7 + 0.3 * io(clamp01((now - T.abbr - 100) / 800)))
  const letters = $derived(
    [...FULL].map((ch, i) => {
      const start = T.name + 150 + i * 28
      let s = 2
      let shown = ch
      if (now < start) s = 0
      else if (ch !== ' ' && now < start + 300 + hash(i) * 180) {
        s = 1
        shown = GLYPHS[Math.floor(hash(i * 13 + Math.floor(now / 55)) * GLYPHS.length)]
      }
      const j = keep[i]
      const from = i - FULL.length / 2
      if (j < 0) {
        const p = io(clamp01((now - T.abbr) / 350))
        return { ch: shown, s, x: from, o: (1 - 0.65 * clamp01((now - T.abbr + 450) / 300)) * (1 - p), k: 1 - 0.6 * p }
      }
      const p = io(clamp01((now - T.abbr - 100) / 800))
      return { ch: i === 20 && p > 0.5 ? 'd' : shown, s, x: from + (j - SHORT.length / 2 - from) * p, o: 1, k: 1 }
    }),
  )

  const libra = zodiac.length - 1
  const [winX, winY] = toScreen(layers[3][winner], cams.verdict)
  const zoomedScale = cams.verdict.scale

  function build() {
    const all = sel => [...root.querySelectorAll(sel)]
    const one = sel => root.querySelector(sel)
    const box = root.getBoundingClientRect()
    const k = box.width / W
    const centre = el => {
      const r = el.getBoundingClientRect()
      return [(r.left + r.width / 2 - box.left) / k, (r.top + r.height / 2 - box.top) / k]
    }

    const world = one('.world')
    const vnodes = all('.vnode')
    const vlabels = all('.vlabel')
    utils.set(world, cams.net)
    all('.card').forEach((el, i) => utils.set(el, { y: -620, rotate: cards[i].tilt - 12 }))

    const tl = createTimeline({
      autoplay: false,
      defaults: { ease: 'outCubic', duration: 400 },
      onUpdate: self => {
        now = self.currentTime
        dialDeg = dialState.deg
      },
      onComplete: () => onend?.(),
    })

    // ambient: the dot grid drifts for the whole piece, then stops with it
    tl.add(one('.grid'), { x: -22, y: -22, duration: T.end, ease: 'linear' }, 0)

    // 1. The question. Typing is derived from `now`; the field enters, the code steps back, "enter" is pressed.
    const field = one('.field')
    tl.add(field, { opacity: [0, 1], y: [10, 0], duration: 500 }, T.field)
    tl.add(all('.code'), { opacity: 0.28, duration: 450, ease: 'inOutSine' }, T.dim)
    tl.add(all('.word'), { color: '#f7f8f8', duration: 450, ease: 'inOutSine' }, T.dim)
    tl.add(field, { scale: [{ to: 0.985, duration: 70, ease: 'outQuad' }, { to: 1, duration: 220, ease: 'outBack(2)' }] }, T.submit)

    // 2. Architecture. The words break apart and fly into the input nodes; the network draws in behind them.
    const [codeA, codeB] = all('.code')
    tl.add(codeA, { opacity: 0, x: -14, duration: 260, ease: 'inQuad' }, T.burst)
    tl.add(codeB, { opacity: 0, x: 14, duration: 260, ease: 'inQuad' }, T.burst)
    tl.add(all('.field-box, .prompt'), { opacity: 0, scaleX: 0.94, duration: 500, ease: 'inQuad' }, T.burst + 120)
    const inputs = all('.node[data-l="0"]')
    all('.word').forEach((el, i) => {
      const [cx, cy] = centre(el)
      const [tx, ty] = toScreen(layers[0][i], cams.net)
      tl.add(el, { x: (cx - W / 2) * 0.1, y: (hash(i) - 0.5) * 14, rotate: (hash(i + 9) - 0.5) * 8, duration: 200, ease: 'outQuad' }, T.burst)
      const at = T.burst + 200 + i * 70
      tl.add(
        el,
        {
          x: { to: tx - cx, ease: 'inOutCubic' },
          y: { to: ty - cy, ease: 'inOutSine' },
          rotate: 0,
          scale: 0.35,
          opacity: [{ to: 1, duration: 520 }, { to: 0, duration: 100 }],
          duration: 620,
        },
        at,
      )
      tl.add(inputs[i], { r: [{ to: 7, duration: 90, ease: 'outQuad' }, { to: 4, duration: 300 }], fill: { from: '#f7f8f8', to: '#16171a', duration: 500 } }, at + 600)
    })
    for (let l = 0; l < 3; l++) tl.add(all(`.node[data-l="${l}"]`), { r: 4, duration: 380, ease: 'outBack(2)', delay: stagger(40) }, 4350 + l * 140)
    tl.add(vnodes, { opacity: 1, scale: [0, 1], duration: 420, ease: 'outBack(1.6)', delay: stagger(50) }, 4770)
    tl.add(vlabels, { opacity: 1, duration: 400, delay: stagger(50) }, 4950)
    tl.add(createDrawable(all('.edge'), 0, 0), { draw: '0 1', duration: 420, ease: 'inOutQuad', delay: stagger(5) }, 4450)

    // signals pass layer to layer, each layer lighting as they land; later, a low hum
    all('.spark').forEach((el, i) => {
      const s = sparks[i]
      const peak = s.faint ? 0.5 : 1
      tl.add(
        el,
        {
          cx: [s.a.x, s.b.x],
          cy: [s.a.y, s.b.y],
          opacity: [{ to: peak, duration: 60 }, { to: peak, duration: s.dur - 120 }, { to: 0, duration: 60 }],
          duration: s.dur,
          ease: 'inOutSine',
        },
        s.at,
      )
    })
    for (let l = 1; l < 3; l++) {
      const nodes = all(`.node[data-l="${l}"]`)
      tl.add(nodes, { r: [{ to: 6, duration: 90 }, { to: 4, duration: 320 }], fill: { from: '#e6e7e9', to: '#16171a', duration: 450 }, delay: stagger(25, { from: 'center' }) }, T.signal + (l - 1) * 300 + 300)
    }
    tl.add(vnodes, { scale: [{ to: 1.35, duration: 100 }, { to: 1, duration: 360 }], delay: stagger(40, { from: 'center' }) }, T.signal + 900)

    // pull back: the network is one part of a larger system
    tl.add(world, { ...cams.wide, duration: 1200, ease: 'inOutQuart' }, T.pull)
    tl.add(one('.core'), { opacity: 1, duration: 700 }, T.pull + 200)
    tl.add(all('.mod'), { opacity: 1, duration: 700, ease: 'inOutSine', delay: stagger(140) }, T.pull + 500)
    tl.add(createDrawable(all('.conduit'), 0, 0), { draw: '0 1', duration: 600, ease: 'inOutQuad', delay: stagger(140) }, T.pull + 800)

    // 3. Cosmos. One centred title, then three inputs, layered.
    const title = one('.title')
    tl.add(title, { opacity: [0, 1], letterSpacing: ['0.6em', '0.32em'], duration: 900 }, T.cosmos)
    tl.add(title, { opacity: 0, y: -8, duration: 400, ease: 'inQuad' }, T.verdict - 200)

    // time: wind back, spin, overshoot a hair, settle on 23:47
    const target = dial.turns * 360 + (dial.minutes / 1440) * 360
    tl.add(dialState, { deg: [{ to: -24, duration: 280, ease: 'inOutQuad' }, { to: target, duration: 2100, ease: 'outQuart' }, { to: target + 1.2, duration: 120, ease: 'outQuad' }, { to: target, duration: 200, ease: 'inOutSine' }] }, T.dial)
    const lock = T.dial + 2380
    tl.add(one('.dial-ring'), { r: [dial.r, dial.r + 18], opacity: [0.9, 0], duration: 700 }, lock)
    tl.add(one('.readout'), { fill: C.time, duration: 300 }, lock)

    // stars: figures flash, faster and faster, until Libra locks in; a teal sweep confirms it
    const zods = all('.zod')
    flashes.forEach((at, i) => tl.add(zods[i], { opacity: [{ to: 1, duration: 50 }, { to: 1, duration: 170 }, { to: 0, duration: 150 }], ease: 'outQuad' }, at))
    tl.add(zods[libra], { opacity: 1, duration: 120 }, T.libra)
    tl.add(createDrawable(all('.libra-line'), 0, 0), { draw: '0 1', duration: 450, ease: 'inOutQuad', delay: stagger(60) }, T.libra)
    tl.add(all('.libra-star'), { r: [{ to: 4, duration: 120 }, { to: 2.4, duration: 300 }], delay: stagger(50) }, T.libra)
    tl.add(one('.sign-label'), { opacity: [0, 1], duration: 400 }, T.libra + 300)
    const SWEEP = 700
    const across = x => ((x + 40) / (sky.w + 80)) * SWEEP
    const libraMid = zodiac[libra].lines.map(([a, b]) => (zodiac[libra].stars[a][0] + zodiac[libra].stars[b][0]) / 2)
    tl.add(one('.sweep'), { x: [-40, sky.w + 40], opacity: [{ to: 1, duration: 120 }, { to: 1, duration: SWEEP - 240 }, { to: 0, duration: 120 }], duration: SWEEP, ease: 'inOutSine' }, T.sweep)
    tl.add(all('.libra-line'), { stroke: C.teal, duration: 200, delay: (_, i) => across(libraMid[i]) }, T.sweep)
    tl.add(all('.libra-star'), { fill: C.teal, duration: 200, delay: (_, i) => across(zodiac[libra].stars[i][0]) }, T.sweep)
    tl.add(one('.sign-label'), { fill: C.teal, duration: 250 }, T.sweep + SWEEP * 0.6)

    // omens: two cards fall under gravity, squash on impact, shake the system, kick up debris and send out waves
    const cardEls = all('.card')
    const shadows = all('.shadow')
    cards.forEach((c, i) => {
      const fall = 560
      const weight = 1 - i * 0.35
      tl.add(cardEls[i], { opacity: { to: 1, duration: 60 }, y: { to: 0, ease: 'inQuad' }, rotate: { to: c.tilt, ease: 'outQuad' }, duration: fall }, c.land - fall)
      tl.add(shadows[i], { opacity: [0, 0.7], rx: [8, 36], duration: fall, ease: 'inQuad' }, c.land - fall)
      tl.add(
        cardEls[i],
        {
          scaleY: [{ to: 0.92, duration: 70, ease: 'outQuad' }, { to: 1, duration: 260, ease: 'outBack(2)' }],
          scaleX: [{ to: 1.05, duration: 70, ease: 'outQuad' }, { to: 1, duration: 260 }],
          y: [{ to: -7 * weight, duration: 120, ease: 'outQuad' }, { to: 0, duration: 160, ease: 'inQuad' }],
        },
        c.land,
      )
      tl.add(
        one('.shake'),
        {
          x: [-5, 4, -2, 0].map(v => ({ to: v * weight, duration: 45 })),
          y: [3, -2, 1, 0].map(v => ({ to: v * weight, duration: 45 })),
          ease: 'inOutQuad',
        },
        c.land,
      )
      tl.add(all(`.debris[data-c="${i}"]`), {
        x: (_, j) => (j % 2 ? 1 : -1) * (18 + hash(j + i * 10) * 34),
        y: [{ to: (_, j) => -6 - hash(j * 3 + i) * 12, duration: 180, ease: 'outQuad' }, { to: 4, duration: 260, ease: 'inQuad' }],
        opacity: [{ to: 1, duration: 30 }, { to: 0, duration: 410, ease: 'inQuad' }],
        duration: 440,
      }, c.land)
      tl.add(all(`.wave[data-c="${i}"]`), { r: [0, 460 - i * 90], opacity: [0.6 * weight + 0.2, 0], strokeWidth: [2, 0.4], duration: 1700, delay: stagger(170) }, c.land)
    })

    // pulses travel the conduits into the core
    const paths = Object.fromEntries(all('.conduit').map(el => [el.dataset.key, el]))
    all('.pulse').forEach((el, i) => {
      const p = pulses[i]
      tl.add(
        el,
        { ...createMotionPath(paths[p.path]), opacity: [{ to: 1, duration: 80 }, { to: 1, duration: p.dur - 160 }, { to: 0, duration: 80 }], duration: p.dur, ease: 'inOutSine' },
        p.at,
      )
    })

    // 4. Verdict. The flicker stops (derived), the camera pushes in, the scores settle, one wins.
    tl.add(world, { ...cams.verdict, duration: 1300, ease: 'inOutQuart' }, T.verdict)
    tl.add(all('.mod'), { opacity: 0.1, duration: 700 }, T.verdict)
    tl.add(all('.core, .edge, .node, .conduit'), { opacity: 0.3, duration: 700 }, T.verdict)
    const losers = [0, 1, 2, 3].filter(i => i !== winner)
    tl.add(losers.map(i => vlabels[i]), { opacity: 0.35, duration: 400 }, T.settle)
    tl.add(losers.map(i => vnodes[i]), { opacity: 0.4, scale: 0.85, duration: 400 }, T.settle)
    tl.add(vnodes[winner], { scale: [{ to: 1.7, duration: 160, ease: 'outQuad' }, { to: 1.3, duration: 420, ease: 'outBack(2)' }] }, T.settle)
    tl.add(one('.burst'), { r: [7, 34], opacity: [0.9, 0], strokeWidth: [2, 0.5], duration: 800 }, T.settle)
    tl.set(one('.link'), { opacity: 1 }, T.answer - 260)
    tl.add(createDrawable(one('.connector'), 0, 0), { draw: '0 1', duration: 360, ease: 'inOutQuad' }, T.answer - 250)
    tl.add(one('.answer'), { opacity: [0, 1], y: [14, 0], duration: 500 }, T.answer)
    tl.add(one('.answer b'), { scale: [0.8, 1], duration: 500, ease: 'outBack(1.6)' }, T.answer + 120)

    // 5. Throughput. The scene leaves; the feed itself is derived from `now`.
    tl.add(one('.scene'), { opacity: 0, duration: 500, ease: 'inQuad' }, T.exit)
    tl.add(all('.answer, .link'), { opacity: 0, y: -10, duration: 400, ease: 'inQuad' }, T.exit + 100)
    tl.add(one('.counter'), { opacity: [0, 1], y: [-6, 0], duration: 500 }, T.feed + 200)
    tl.add(one('.feed-box'), { opacity: 0, duration: 600, ease: 'inQuad' }, T.fade)
    tl.add(one('.counter'), { opacity: 0, duration: 500, ease: 'inQuad' }, T.fade + 200)

    // 6. Sign-off. The full name decodes out of the dark and collapses into the short one (derived), the mark draws
    // above it, the full name returns small underneath. Hold.
    tl.set(one('.sign'), { opacity: 1 }, T.name)
    tl.add(one('.glow'), { opacity: [0, 1], scale: [0.8, 1], duration: 1600 }, T.name)
    tl.add(one('.wordmark'), { y: [8, 0], duration: 1200 }, T.name)
    tl.add(createDrawable(all('.mark .draw'), 0, 0), { draw: '0 1', duration: 600, ease: 'inOutCubic', delay: stagger(150) }, T.abbr + 650)
    tl.add(all('.mark circle'), { opacity: [0, 1], scale: [0, 1], duration: 400, ease: 'outBack(2.5)', delay: stagger(90) }, T.abbr + 1050)
    tl.add(one('.sub'), { opacity: [0, 1], y: [6, 0], letterSpacing: ['0.4em', '0.24em'], duration: 700 }, T.abbr + 1100)
    tl.call(() => {}, T.end)

    ready = true
    if (still) {
      tl.seek(T.end)
      now = T.end
      onend?.()
    } else tl.play()
    return tl
  }

  onMount(() => {
    let tl
    let gone = false
    // the words are measured for their flight, so wait for Geist Mono
    document.fonts.ready.then(() => {
      if (!gone) tl = build()
    })
    return () => {
      gone = true
      tl?.revert()
    }
  })
</script>

<div class="cosmos" class:ready bind:this={root}>
  <div class="grid"></div>

  <svg viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <filter id="{uid}-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="2.5" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <linearGradient id="{uid}-sweep" x1="0" x2="1">
        <stop offset="0" stop-color={C.teal} stop-opacity="0" />
        <stop offset="0.75" stop-color={C.teal} stop-opacity="0.4" />
        <stop offset="1" stop-color={C.teal} stop-opacity="0" />
      </linearGradient>
      <clipPath id="{uid}-sky"><rect x="-8" y="-8" width={sky.w + 16} height={sky.h + 16} rx="10" /></clipPath>
    </defs>

    <g class="scene">
      <g class="world">
        <g class="shake">
          <!-- conduits from each input to the core -->
          {#each Object.entries(conduits) as [key, d]}
            <path class="conduit" data-key={key} {d} fill="none" stroke="#3a3d44" stroke-width="1" />
          {/each}

          <!-- time: a 24-hour day/night dial, midnight at the top -->
          <g class="mod" opacity="0" transform="translate({dial.x} {dial.y})">
            <circle r={dial.r} fill="#0b0d12" stroke="rgba(255,255,255,0.12)" />
            <path d="M {-dial.r} 0 A {dial.r} {dial.r} 0 0 1 {dial.r} 0 Z" fill="#3b4a8c" fill-opacity="0.16" />
            <path d="M {dial.r} 0 A {dial.r} {dial.r} 0 0 1 {-dial.r} 0 Z" fill={C.time} fill-opacity="0.06" />
            {#each Array(24) as _, h}
              <line y1={-dial.r + 4} y2={-dial.r + (h % 6 ? 8 : 13)} stroke="#8a8f98" stroke-opacity={h % 6 ? 0.4 : 0.9} transform="rotate({h * 15})" />
            {/each}
            <path d="M 0 -29 A 6 6 0 0 0 0 -17 A 7 7 0 0 1 0 -29 Z" fill="#c9ccd1" fill-opacity="0.6" />
            <circle cy="23" r="4" fill={C.time} fill-opacity="0.6" />
            <circle class="dial-ring" r={dial.r} fill="none" stroke={C.time} stroke-width="1.5" opacity="0" />
            <line y1="8" y2={-dial.r + 12} stroke={C.time} stroke-width="2" stroke-linecap="round" transform="rotate({dialDeg})" />
            <circle r="3" fill={C.time} />
            <text class="readout" y={dial.r + 24} text-anchor="middle" fill="#8a8f98">{readout}</text>
          </g>

          <!-- stars: a patch of sky where the zodiac flashes -->
          <g class="mod" opacity="0" transform="translate({sky.x} {sky.y})">
            <rect x="-8" y="-8" width={sky.w + 16} height={sky.h + 16} rx="10" fill="#0b0d12" stroke="rgba(255,255,255,0.08)" />
            {#each dust as d, i}
              <circle cx={d.x} cy={d.y} r={d.r} fill="#c9ccd1" opacity={0.12 + 0.3 * (0.5 + 0.5 * Math.sin(now / 380 + i * 1.7))} />
            {/each}
            {#each zodiac as z, i}
              <g class="zod" opacity="0">
                {#each z.lines as [a, b]}
                  <line class:libra-line={i === libra} x1={z.stars[a][0]} y1={z.stars[a][1]} x2={z.stars[b][0]} y2={z.stars[b][1]} stroke={C.stars} stroke-opacity="0.75" />
                {/each}
                {#each z.stars as [x, y], k}
                  <circle class:libra-star={i === libra} cx={x} cy={y} r={1.6 + hash(i * 10 + k)} fill={C.stars} filter="url(#{uid}-glow)" />
                {/each}
              </g>
            {/each}
            <g clip-path="url(#{uid}-sky)"><rect class="sweep" x="-40" y="-8" width="40" height={sky.h + 16} fill="url(#{uid}-sweep)" opacity="0" /></g>
            <text class="sign-label" x={sky.w / 2} y={sky.h + 30} text-anchor="middle" fill={C.stars} opacity="0">LIBRA</text>
          </g>

          <!-- omens: The Tower and The Moon -->
          <g class="mod" opacity="0">
            {#each cards as c, i}
              <g transform="translate({c.x} {c.y})">
                <ellipse class="shadow" cy="64" rx="8" ry="5" fill="#000" opacity="0" />
                {#each Array(6) as _, j}<circle class="debris" data-c={i} cy="58" r={1 + hash(j + i) * 1.2} fill={C.omens} opacity="0" />{/each}
                <g class="card" opacity="0">
                  <rect x="-38" y="-59" width="76" height="118" rx="6" fill="#1a0c0e" stroke={C.omens} stroke-width="1.2" />
                  <rect x="-33" y="-54" width="66" height="108" rx="3" fill="none" stroke={C.omens} stroke-opacity="0.3" />
                  <text class="numeral" y="-40" text-anchor="middle">{c.numeral}</text>
                  <g fill="none" stroke={C.omens} stroke-width="1.2" stroke-linejoin="round">
                    {#if i === 0}
                      <path d="M -9 18 V -10 H 9 V 18 M -11 -10 V -16 H -6 V -12 H -2 V -16 H 2 V -12 H 6 V -16 H 11 V -10 Z M -3 18 V 10 A 3 3 0 0 1 3 10 V 18 M -16 18 H 16" />
                      <path d="M 16 -30 L 7 -18 L 13 -17 L 3 -5" stroke-width="1.5" />
                    {:else}
                      <path d="M 0 -18 A 14 14 0 0 0 0 10 A 16 16 0 0 1 0 -18 Z" fill={C.omens} fill-opacity="0.2" />
                      <circle cx="-8" cy="20" r="1.2" /><circle cy="24" r="1.2" /><circle cx="8" cy="20" r="1.2" />
                    {/if}
                  </g>
                  <text class="cardname" y="47" text-anchor="middle">{c.name}</text>
                </g>
              </g>
            {/each}
          </g>

          <!-- disturbance -->
          {#each cards as c, i}
            {#each Array(3) as _}<circle class="wave" data-c={i} cx={c.x} cy={c.y + 59} r="0" fill="none" stroke={C.omens} opacity="0" />{/each}
          {/each}

          <!-- the core: network, signals, verdict nodes -->
          <g class="core" opacity="0">
            <rect x="206" y="215" width="388" height="180" rx="14" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.1)" />
            <text class="tag" x="220" y="207">isIt · core</text>
          </g>
          {#each edges as e}<line class="edge" x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="#ffffff" stroke-opacity="0.13" stroke-width="0.8" />{/each}
          {#each layers.slice(0, 3) as layer, l}
            {#each layer as p}<circle class="node" data-l={l} cx={p.x} cy={p.y} r="0" fill="#16171a" stroke="#8a8f98" stroke-width="1" />{/each}
          {/each}
          {#each sparks as s}<circle class="spark" r={s.faint ? 1.5 : 2.2} fill={s.faint ? '#8a8f98' : '#f7f8f8'} opacity="0" />{/each}
          {#each pulses as p}<circle class="pulse" r="3.2" fill={p.color} opacity="0" filter="url(#{uid}-glow)" />{/each}

          {#each layers[3] as p, i}
            <g transform="translate({p.x} {p.y})">
              <circle r={9 + 7 * hot[i]} fill="none" stroke={hotColor[i]} stroke-opacity={hot[i] * 0.5} />
              <g class="vnode" opacity="0">
                <circle r="7" fill="#16171a" stroke="#8a8f98" stroke-width="1.2" />
                {#each SIGNALS as color, k}<circle r="6" fill={color} opacity={flick[i][k]} />{/each}
                <circle r="6" fill={C.teal} opacity={resolved && i === winner ? 1 : 0} filter="url(#{uid}-glow)" />
              </g>
              <g class="vlabel" opacity="0" fill={resolved && i === winner ? C.teal : '#c9ccd1'}>
                <text class="vname" x="15" y="3.5">{verdicts[i].toUpperCase()}</text>
                <text class="vscore" x="80" y="3.5">{scores ? scores[i].toFixed(2) : '–.––'}</text>
                <rect x="106" y="-2.5" height="5" rx="1" width={scores ? scores[i] * 120 : 0} fill-opacity={resolved && i === winner ? 1 : 0.45} />
              </g>
            </g>
          {/each}
          <circle class="burst" cx={layers[3][winner].x} cy={layers[3][winner].y} r="7" fill="none" stroke={C.teal} opacity="0" />
        </g>
      </g>
    </g>
  </svg>

  <!-- 1. the input field -->
  <div class="field">
    <div class="field-box"></div>
    <span class="prompt">›</span>
    <span class="line">
      {#each segments as s}<span class={s.kind}>{#each s.chars as c}<span class:off={c.i >= typed}>{c.ch}</span>{/each}</span>{/each}
      <i class="caret" class:on={caretOn} style:left="{typed}ch"></i>
    </span>
  </div>

  <p class="title">Consulting the cosmos</p>

  <!-- 4. the answer, linked to the winning node -->
  <svg class="link" viewBox="0 0 800 600" width="800" height="600">
    <path class="connector" d="M {winX} {winY + 10 * zoomedScale} V 438" fill="none" stroke={C.teal} stroke-width="1.5" />
  </svg>
  <div class="answer">
    <code>isIt(<span>'{question}'</span>)</code>
    <p><b>→ {verdicts[winner].toUpperCase()}</b><span>{final[winner].toFixed(2)} · 1ms</span></p>
  </div>

  <!-- 5. throughput -->
  <p class="counter"><b>{count.toLocaleString('en-US')}</b>{count === 1 ? 'decision' : 'decisions'}</p>
  <div class="feed-box">
    {#if feedOn}
      <div class="feed" style:transform="translateY({120 + scroll * ROW}px)" style:filter={blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : null}>
        {#each feed as row, i}
          {#if i < emitted && scroll - i - 1 < 17}
            {@const shown = ft - emissions[i] >= reveal[i]}
            <p style:top="{-(i + 1) * ROW}px" style:opacity={rowOpacity(scroll - i - 1)}>
              <span>{row.q}</span><i>→</i><b style:color={shown ? verdictColor[row.v] : null}>{shown ? row.v.toUpperCase() : '···'}</b><small>{shown ? row.ms : ''}</small>
            </p>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <!-- 6. sign-off -->
  <div class="glow"></div>
  <div class="sign">
    <svg class="mark" width="44" height="44" viewBox="0 0 22 22">
      <rect class="draw" x="0.75" y="0.75" width="20.5" height="20.5" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" />
      <path class="draw" d="M6 11h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
      <circle cx="11" cy="6.5" r="1.4" fill="var(--accent)" opacity="0" />
      <circle cx="11" cy="15.5" r="1.4" fill="var(--accent)" opacity="0" />
    </svg>
    <p class="wordmark" style:scale={nameScale}>
      {#each letters as l}<span data-s={l.s} style:left="calc(50% + {l.x}ch)" style:opacity={l.o} style:scale={l.k}>{l.ch}</span>{/each}
    </p>
    <p class="sub"><b>B</b>alanced <b>A</b>ssessment Decisions</p>
  </div>

  <div class="vignette"></div>
</div>

<style>
  .cosmos { position: relative; width: 800px; height: 600px; overflow: hidden; background: #07080a; color: var(--soft); font-family: var(--mono); }
  .cosmos:not(.ready) > * { visibility: hidden; }
  .cosmos > * { position: absolute; }
  .cosmos > svg { inset: 0; }
  .grid { inset: -40px; background: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px) 0 0 / 22px 22px; }
  .vignette { inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.6)); }

  /* SVG pieces that scale or rotate about their own centre */
  .vnode, .card, .mark circle { transform-box: fill-box; transform-origin: center; }
  text { font-family: var(--mono); }
  .readout { font-size: 13px; letter-spacing: 0.08em; }
  .sign-label { font-size: 10px; letter-spacing: 0.3em; }
  .numeral { font-size: 8px; fill: #f87171; letter-spacing: 0.1em; }
  .cardname { font-size: 6.5px; fill: #f87171; letter-spacing: 0.14em; }
  .tag { font-size: 9px; fill: #8a8f98; letter-spacing: 0.12em; }
  .vname { font-size: 10px; letter-spacing: 0.06em; }
  .vscore { font-size: 10px; font-variant-numeric: tabular-nums; }

  .field { left: 80px; top: 268px; width: 640px; height: 64px; padding: 0 24px; display: flex; align-items: center; gap: 14px; font-size: 21px; opacity: 0; }
  .field-box { position: absolute; inset: 0; border: 1px solid var(--edge-strong); border-radius: 12px; background: var(--panel); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
  .prompt { position: relative; color: var(--muted); }
  .line { position: relative; white-space: pre; }
  .word { display: inline-block; color: var(--soft); }
  .code { display: inline-block; color: var(--muted); }
  .off { visibility: hidden; }
  .caret { position: absolute; top: 0.1em; width: 2px; height: 1.15em; margin-left: 1px; background: var(--ink); opacity: 0; }
  .caret.on { opacity: 1; }

  .title { top: 40px; left: 0; right: 0; text-align: center; font-size: 13px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--ink-2); opacity: 0; }

  .link { inset: 0; opacity: 0; pointer-events: none; }
  .answer { left: 150px; top: 438px; width: 500px; padding: 16px 22px; border: 1px solid rgba(45, 212, 191, 0.35); border-radius: 12px; background: rgba(15, 16, 17, 0.94); box-shadow: 0 0 48px rgba(45, 212, 191, 0.1); opacity: 0; }
  .answer code { font-size: 13px; color: var(--muted); }
  .answer code span { color: var(--ink-2); }
  .answer p { margin-top: 6px; display: flex; align-items: baseline; justify-content: space-between; }
  .answer b { display: inline-block; transform-origin: left center; font-size: 32px; font-weight: 500; color: #2dd4bf; }
  .answer p span { font-size: 13px; color: var(--muted); }

  .counter { top: 34px; left: 0; right: 0; display: flex; justify-content: center; align-items: baseline; gap: 10px; font-size: 13px; color: var(--muted); opacity: 0; }
  .counter b { font-size: 22px; font-weight: 500; color: var(--ink); font-variant-numeric: tabular-nums; }
  .feed-box { inset: 0; mask-image: linear-gradient(to bottom, transparent 82px, #000 122px, #000 460px, transparent 590px); }
  .feed { position: absolute; top: 0; left: 0; width: 100%; will-change: transform; }
  .feed p { position: absolute; left: 80px; width: 640px; height: 30px; display: grid; grid-template-columns: 1fr 24px 96px 58px; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.04); font-size: 14px; color: var(--ink-2); white-space: nowrap; }
  .feed span { overflow: hidden; text-overflow: ellipsis; }
  .feed i { font-style: normal; color: var(--muted); }
  .feed b { font-weight: 500; color: var(--muted); }
  .feed small { text-align: right; font-size: 12px; color: var(--muted); }

  .glow { left: 150px; top: 140px; width: 500px; height: 320px; background: radial-gradient(closest-side, rgba(45, 212, 191, 0.13), transparent); opacity: 0; }
  .sign { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; opacity: 0; }
  .mark { color: var(--ink); }
  .wordmark { position: relative; width: 100%; height: 1.15em; font-size: 56px; font-weight: 500; line-height: 1.15; color: var(--ink); }
  .wordmark span { position: absolute; top: 0; width: 1ch; text-align: center; white-space: pre; }
  .wordmark [data-s='0'] { visibility: hidden; }
  .wordmark [data-s='1'] { color: #2dd4bf; }
  .sub { font-size: 12.5px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--muted); opacity: 0; }
  .sub b { font-weight: 500; color: #2dd4bf; }
</style>
