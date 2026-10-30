<!--
  Hero animation "Deck": the Series A pitch, with a laser pointer. Traction that leaves the slide, revenue that is
  consistently $0.00, a market of every decision ever made, use of funds, and the ask. ~16s.
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
  const END = 16500
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
  ]
  const dot = $derived.by(() => {
    if (now < laser[0][0] || now >= S[5]) return null
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
  .laser { position: absolute; z-index: 5; width: 12px; height: 12px; margin: -6px; border-radius: 50%; background: #ff2020; box-shadow: 0 0 10px 3px rgba(255, 32, 32, 0.7); }
  footer { left: 40px; right: 40px; top: 478px; height: 70px; padding: 0 18px; display: flex; align-items: center; gap: 20px; border: 1px solid var(--edge); border-radius: 10px; background: var(--panel); color: var(--muted); font: 13px var(--mono); }
  footer p { flex: 1; font: italic 16px var(--serif); color: var(--soft); }
  .rec { color: #f87171; }
</style>
