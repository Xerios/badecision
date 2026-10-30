<!--
  Hero animation "Deck": the Series A pitch, with a laser pointer. Traction that leaves the slide, revenue that is
  consistently $0.00, a market of every decision ever made, use of funds, and the ask. A cat, seen from behind, keeps
  jumping for the laser dot and missing; on the last slide it finally catches it. ~18s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger, createDrawable } from 'animejs'
  import { play, hash, clamp01, span, io3 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const S = [0, 2600, 5300, 7900, 10500, 13000] // slide starts
  const END = S[5] + 5300
  const CATCH = S[5] + 3450 // the cat's paws close on the dot
  const notes = ['(pause for applause)', '(point at the line until it leaves the slide)', '(say "consistent" with confidence)', '(do not mention the fridge)', '(the astrologer is in the room)', '(wait)']
  const slide = $derived(S.findLastIndex(s => now >= s))
  // traction: exponential, then off the top of the slide
  const traction = Array.from({ length: 40 }, (_, i) => [40 + i * 15, 300 - 4 * Math.exp(i / 7.2)])
  const tracePts = $derived(traction.slice(0, Math.max(2, Math.ceil(span(now, S[1] + 500, 1600, p => p) * traction.length))))
  const tip = $derived(tracePts.at(-1))

  // the laser: [time, x, y] in slide coordinates (720×405)
  const laser = [
    [S[1] + 600, 120, 290], [S[1] + 2000, ...traction[30]], [S[1] + 2400, 640, 10],
    [S[2] + 700, 100, 290], [S[2] + 1700, 600, 290], [S[2] + 2200, 600, 290],
    [S[3] + 800, 360, 230], [S[3] + 1500, 360, 300], [S[3] + 2200, 360, 315],
    [S[4] + 900, 380, 170], [S[4] + 2000, 400, 190],
    [S[5] + 2000, 700, 330], [S[5] + 2700, 560, 250], [S[5] + 3100, 540, 170],
  ]
  // the cat's misses: [time, x of its centre, how high it gets]
  const jumps = [
    [S[1] + 2250, 560, 142],
    [S[2] + 1000, 150, 127],
    [S[4] + 2050, 400, 210],
  ]
  const dot = $derived.by(() => {
    if (now < laser[0][0] || (now >= S[5] && now < S[5] + 2000) || now >= CATCH) return null
    const k = laser.findIndex(p => p[0] > now)
    if (k <= 0) return k === 0 ? null : laser.at(-1).slice(1)
    const [t0, x0, y0] = laser[k - 1]
    const [t1, x1, y1] = laser[k]
    const p = io3(clamp01((now - t0) / (t1 - t0)))
    return [x0 + (x1 - x0) * p + Math.sin(now / 47) * 2, y0 + (y1 - y0) * p + Math.cos(now / 53) * 2]
  })

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        const slides = all('.slide')
        tl.add(one('.frame'), { opacity: [0, 1], scale: [0.96, 1], duration: 600 }, 0)
        tl.add(all('.s0 > *'), { opacity: [0, 1], y: [14, 0], duration: 600, delay: stagger(200) }, 300)
        slides.forEach((el, i) => {
          if (i === 0) return
          tl.add(slides[i - 1], { x: -60, opacity: 0, duration: 450, ease: 'inQuad' }, S[i] - 300)
          tl.add(el, { x: [60, 0], opacity: [0, 1], duration: 500 }, S[i])
        })
        tl.add(one('.flat'), { width: [0, 600], duration: 1000, ease: 'inOutSine' }, S[2] + 500)
        tl.add(one('.consistent'), { opacity: [0, 1], scale: [1.4, 1], rotate: [-12, -6], duration: 400, ease: 'outBack(2)' }, S[2] + 1700)
        tl.add(all('.ring'), { scale: [0, 1], opacity: [0, 1], duration: 600, ease: 'outBack(1.4)', delay: stagger(350) }, S[3] + 300)
        tl.add(createDrawable(one('.pie'), 0, 0), { draw: '0 1', duration: 1100, ease: 'inOutCubic' }, S[4] + 400)
        tl.add(one('.pie-label'), { opacity: [0, 1], duration: 500 }, S[4] + 1400)
        tl.add(one('.s5 b'), { opacity: [0, 1], scale: [1.4, 1], duration: 600, ease: 'outBack(1.5)' }, S[5] + 700)
        tl.add(one('.s5 small'), { opacity: [0, 1], duration: 700 }, S[5] + 1600)

        // the cat: up, paws flailing, the dot is already elsewhere, back down
        const cat = one('.cat')
        const [armL, armR] = all('.arm')
        jumps.forEach(([t, x, h]) => {
          tl.set(cat, { x: x - 100 }, t - 1)
          tl.add(cat, { y: [{ to: -h, duration: 260, ease: 'outQuad' }, { to: -h + 6, duration: 140, ease: 'inOutSine' }, { to: 0, duration: 380, ease: 'inQuad' }] }, t)
          tl.add(cat, { rotate: [{ to: 3, duration: 400 }, { to: -2, duration: 380, ease: 'inQuad' }] }, t)
          tl.add(armL, { rotate: [{ to: -12, duration: 130 }, { to: 8, duration: 160 }, { to: -5, duration: 160 }, { to: 0, duration: 200 }] }, t + 100)
          tl.add(armR, { rotate: [{ to: 10, duration: 140 }, { to: -9, duration: 150 }, { to: 4, duration: 170 }, { to: 0, duration: 200 }] }, t + 100)
        })
        // the catch: ears peek, the wiggle, the jump, paws close, and it settles with the dot glowing between its paws
        tl.set(cat, { x: 440, rotate: 0 }, S[5] + 2199)
        tl.add(cat, { y: -62, duration: 320, ease: 'outCubic' }, S[5] + 2200)
        tl.add(cat, { x: [{ to: 444, duration: 90 }, { to: 436, duration: 120 }, { to: 443, duration: 110 }, { to: 437, duration: 110 }, { to: 440, duration: 90 }], ease: 'inOutSine' }, S[5] + 2600)
        tl.add(cat, { y: [{ to: -50, duration: 140, ease: 'inOutSine' }, { to: -287, duration: 300, ease: 'outQuad' }] }, CATCH - 440)
        tl.add(armL, { rotate: 17, duration: 120, ease: 'outBack(2)' }, CATCH - 60)
        tl.add(armR, { rotate: -17, duration: 120, ease: 'outBack(2)' }, CATCH - 60)
        tl.add(one('.caught'), { opacity: [0, 1, 0.7], scale: [0.4, 1.3, 1], duration: 500 }, CATCH)
        tl.add(cat, { y: -92, duration: 650, ease: 'inOutQuad' }, CATCH + 450)
        return END
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="deck" class:ready bind:this={root}>
  <div class="frame">
    <section class="slide s0">
      <small>Series A · Confidential</small>
      <h2>BAdecision</h2>
      <p>Decisions as a service, <em>without</em> the service.</p>
    </section>
    <section class="slide">
      <h3>Traction</h3>
      <svg width="720" height="405" viewBox="0 0 720 405" style="overflow: visible">
        <line x1="40" x2="680" y1="300" y2="300" stroke="#d0d4da" />
        <polyline points={tracePts.map(p => p.join(',')).join(' ')} fill="none" stroke="#0f766e" stroke-width="4" stroke-linecap="round" />
        {#if tip}<circle cx={tip[0]} cy={tip[1]} r="6" fill="#0f766e" />{/if}
        <text x="40" y="324" class="axis">2025</text><text x="640" y="324" class="axis">2026</text>
      </svg>
      <p class="label">Decisions made ↑</p>
    </section>
    <section class="slide">
      <h3>Revenue</h3>
      <div class="chart"><i class="flat"></i><span>$0.00</span></div>
      <p class="consistent">Consistent.</p>
    </section>
    <section class="slide">
      <h3>Market</h3>
      <div class="rings">
        <i class="ring r1"><span>TAM · every decision ever made</span></i>
        <i class="ring r2"><span>SAM · the ones nobody wants to make</span></i>
        <i class="ring r3"><span>SOM · Fridays</span></i>
      </div>
    </section>
    <section class="slide">
      <h3>Use of funds</h3>
      <svg width="720" height="405" viewBox="0 0 720 405">
        <circle class="pie" cx="300" cy="225" r="70" fill="none" stroke="#7c3aed" stroke-width="140" transform="rotate(-90 300 225)" />
      </svg>
      <p class="pie-label"><b>100%</b> Dedicated astrologer</p>
    </section>
    <section class="slide s5">
      <h3>The ask</h3>
      <b>$0</b>
      <small>There is nothing to procure.</small>
    </section>
    <div class="catbox" aria-hidden="true">
      <div class="cat"><svg width="200" height="420" viewBox="0 0 200 420">
        <g class="arm l"><path d="M64 215 L 42 62" /><ellipse cx="41" cy="52" rx="17" ry="15" /></g>
        <g class="arm r"><path d="M136 215 L 158 62" /><ellipse cx="159" cy="52" rx="17" ry="15" /></g>
        <path d="M24 420 C 24 300, 36 196, 100 184 C 164 196, 176 300, 176 420 Z" />
        <path d="M52 132 L 44 70 Q 46 62 54 66 L 94 104 Z M148 132 L 156 70 Q 154 62 146 66 L 106 104 Z" stroke-linejoin="round" />
        <ellipse cx="100" cy="150" rx="60" ry="52" />
        <path class="whisker" d="M44 160 L 14 154 M44 168 L 16 174 M156 160 L 186 154 M156 168 L 184 174" />
        <circle class="caught" cx="100" cy="52" r="9" />
      </svg></div>
    </div>
    {#if dot}<i class="laser" style:left="{dot[0]}px" style:top="{dot[1]}px"></i>{/if}
  </div>
  <footer>
    <span>{slide + 1} / {S.length}</span>
    <p>{notes[slide]}</p>
    <span class="rec">● Presenting</span>
  </footer>
</div>

<style>
  .deck { position: relative; width: 800px; height: 600px; overflow: hidden; background: #0b0c0e; font-family: var(--sans); }
  .deck:not(.ready) > * { visibility: hidden; }
  .deck > * { position: absolute; }
  .frame { left: 40px; top: 50px; width: 720px; height: 405px; border-radius: 6px; background: #fbfbfa; color: #111; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6); opacity: 0; }
  .slide { position: absolute; inset: 0; padding: 34px 40px; opacity: 0; }
  .slide svg { position: absolute; left: 0; top: 0; }
  .s0 { opacity: 1; display: flex; flex-direction: column; justify-content: center; gap: 10px; padding-left: 60px; }
  .s0 > * { opacity: 0; }
  .s0 small { font: 600 12px var(--mono); letter-spacing: 0.12em; text-transform: uppercase; color: #0f766e; }
  .s0 h2 { color: #111; font: 700 72px/1 var(--sans); letter-spacing: -0.05em; }
  .s0 p { font-size: 20px; color: #444; }
  .s0 em { font: italic 1.15em var(--serif); }
  h3 { position: relative; z-index: 1; font: 700 30px var(--sans); letter-spacing: -0.04em; color: #111; }
  .axis { font: 11px var(--mono); fill: #888; }
  .label { position: absolute; left: 60px; top: 90px; font: 600 15px var(--sans); color: #0f766e; }
  .chart { position: absolute; left: 60px; right: 60px; top: 110px; height: 220px; border-left: 1px solid #d0d4da; border-bottom: 1px solid #d0d4da; }
  .flat { position: absolute; left: 0; bottom: 0; height: 4px; width: 0; background: #0f766e; }
  .chart span { position: absolute; right: -6px; bottom: 12px; font: 600 14px var(--mono); color: #0f766e; }
  .consistent { position: absolute; left: 380px; top: 170px; padding: 6px 16px; border: 3px solid #16a34a; border-radius: 8px; color: #16a34a; font: 800 30px var(--sans); rotate: -6deg; opacity: 0; }
  .rings { position: absolute; inset: 0; }
  .ring { position: absolute; left: 50%; top: 56%; display: block; border-radius: 50%; translate: -50% -50%; opacity: 0; }
  .ring span { position: absolute; left: 50%; translate: -50% 0; white-space: nowrap; font: 600 13px var(--sans); color: #fff; font-style: normal; }
  .r1 { width: 330px; height: 330px; background: #c7d2fe; }
  .r1 span { top: 20px; color: #3730a3; }
  .r2 { width: 220px; height: 220px; background: #818cf8; translate: -50% -42%; }
  .r2 span { top: 18px; }
  .r3 { width: 96px; height: 96px; background: #4338ca; translate: -50% -14%; }
  .r3 span { top: 38px; }
  .pie-label { position: absolute; left: 470px; top: 190px; display: flex; flex-direction: column; font: 600 18px var(--sans); color: #333; opacity: 0; }
  .pie-label b { font: 800 46px var(--sans); color: #7c3aed; letter-spacing: -0.04em; }
  .s5 { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
  .s5 h3 { position: absolute; left: 40px; top: 34px; }
  .s5 b { font: 800 150px/1 var(--sans); letter-spacing: -0.06em; color: #111; opacity: 0; }
  .s5 small { font-size: 22px; color: #555; opacity: 0; }
  .catbox { position: absolute; z-index: 4; inset: 0; overflow: hidden; border-radius: 6px; pointer-events: none; }
  .cat { position: absolute; left: 0; top: 405px; width: 200px; height: 420px; transform-origin: 100px 420px; }
  .cat svg { display: block; }
  .cat path, .cat ellipse { fill: #26262b; stroke: #3b3b43; stroke-width: 1.5; }
  .arm path { stroke: #26262b; stroke-width: 28; stroke-linecap: round; }
  .arm.l { transform-origin: 64px 215px; }
  .arm.r { transform-origin: 136px 215px; }
  .cat .whisker { fill: none; stroke: #c9ccd1; stroke-width: 1.2; stroke-linecap: round; opacity: 0.7; }
  .caught { fill: #ff2020; filter: drop-shadow(0 0 8px rgba(255, 32, 32, 0.9)); opacity: 0; transform-box: fill-box; transform-origin: center; }
  .laser { position: absolute; z-index: 5; width: 12px; height: 12px; margin: -6px; border-radius: 50%; background: #ff2020; box-shadow: 0 0 10px 3px rgba(255, 32, 32, 0.7); }
  footer { left: 40px; right: 40px; top: 478px; height: 70px; padding: 0 18px; display: flex; align-items: center; gap: 20px; border: 1px solid var(--edge); border-radius: 10px; background: var(--panel); color: var(--muted); font: 13px var(--mono); }
  footer p { flex: 1; font: italic 16px var(--serif); color: var(--soft); }
  .rec { color: #f87171; }
</style>
