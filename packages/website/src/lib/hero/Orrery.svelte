<!--
  Hero animation "Orrery": an astrolabe draws itself around a question. The moon, Mercury going retrograde, the day's
  omen and a fixed astrological influence report in; the planets align on Leo and the verdict ring settles. ~16.5s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger, createDrawable } from 'animejs'
  import { play, clamp01, lerp, span, typeOut, io3 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { question: 1800, moon: 2800, retro: 4300, omen: 5800, influence: 7000, align: 8200, aligned: 9800, verdict: 11000, outro: 14000, name: 15500, end: 19500 }
  const signs = ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES']
  const LEO = 4
  const R = { outer: 250, band: 206, ring: 86, disc: 74 }
  const AIM = 30 // where Leo ends up: up and to the right
  const bandAt = t => -(LEO * 30 + 15 - AIM) * io3(clamp01(t / T.aligned)) // the zodiac turns, settling with Leo at AIM
  const band = $derived(bandAt(now))

  // planets: radius, start angle, deg/ms, colour; Mercury reverses at T.retro
  const planets = [
    { name: 'Mercury', r: 176, a0: 200, w: 0.045, color: '#c9ccd1', size: 4.5 },
    { name: 'Venus', r: 148, a0: 310, w: 0.022, color: '#fcd34d', size: 6 },
    { name: 'Mars', r: 120, a0: 80, w: 0.015, color: '#ffa198', size: 5 },
    { name: 'Moon', r: 100, a0: 150, w: 0.03, color: '#e6e7e9', size: 7 },
  ]
  const D = 800
  // Mercury's apparent angle: forward, slows, reverses over D ms (integral of a linear ramp from w to -w)
  const travel = (p, t) => {
    if (p.name !== 'Mercury' || t < T.retro) return p.w * t
    const x = t - T.retro
    return p.w * (x < D ? T.retro + x - (x * x) / D : T.retro - (x - D))
  }
  const free = (p, t) => p.a0 + travel(p, t)
  const targets = planets.map((p, i) => {
    const aim = AIM + (i - 1.5) * 2 // nearly a line
    const a = free(p, T.aligned)
    return aim + 360 * Math.round((a - aim) / 360)
  })
  const angles = $derived(planets.map((p, i) => lerp(free(p, now), targets[i], span(now, T.align, T.aligned - T.align, io3))))
  const polar = (r, deg) => [r * Math.sin((deg * Math.PI) / 180), -r * Math.cos((deg * Math.PI) / 180)]
  const retro = $derived(now >= T.retro && now < T.align)

  // the verdict ring: yes / no / maybe / not sure, from even to decided
  const final = [0.18, 0.61, 0.14, 0.07]
  const verdictColors = ['#8ee6ae', '#ffa198', '#fcd34d', '#8a8f98']
  const shares = $derived(final.map(f => lerp(0.25, f, span(now, T.verdict, 700, io3))))
  const C = 2 * Math.PI * R.ring
  const omen = $derived(typeOut('Beware of Fridays.', now, T.omen + 300, 55))
  const needle = $derived(span(now, T.influence + 200, 700, p => (p < 1 ? 1 - (1 - p) ** 3 * Math.cos(p * 9) : 1)) * 0.5)

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(createDrawable(all('.ring'), 0, 0), { draw: '0 1', duration: 1200, ease: 'inOutCubic', delay: stagger(120) }, 0)
        tl.add(all('.tick'), { opacity: [0, 1], duration: 300, delay: stagger(8) }, 300)
        tl.add(all('.sign'), { opacity: [0, 0.75], duration: 400, delay: stagger(60) }, 600)
        tl.add(all('.planet'), { opacity: [0, 1], duration: 600, delay: stagger(120) }, 1100)
        tl.add(one('.question'), { opacity: [0, 1], y: [10, 0], duration: 700 }, T.question)
        tl.add(one('.panel.moon'), { opacity: [0, 1], x: [-16, 0], duration: 600 }, T.moon)
        tl.add(one('.panel.mercury'), { opacity: [0, 1], x: [16, 0], duration: 600 }, T.retro + 200)
        tl.add(one('.retro-ring'), { r: [6, 30], opacity: [0.9, 0], duration: 900 }, T.retro + 200)
        tl.add(one('.panel.omen'), { opacity: [0, 1], x: [-16, 0], duration: 600 }, T.omen)
        tl.add(one('.panel.influence'), { opacity: [0, 1], x: [16, 0], duration: 600 }, T.influence)
        // alignment: the beam to Leo, the sign lights
        tl.add(createDrawable(one('.beam'), 0, 0), { draw: '0 1', duration: 600, ease: 'inOutQuad' }, T.aligned - 300)
        tl.add(one('.leo'), { opacity: [0, 1], duration: 500 }, T.aligned)
        tl.add(one('.question'), { opacity: 0, scale: 0.9, duration: 350, ease: 'inQuad' }, T.verdict)
        tl.add(one('.answer'), { opacity: [0, 1], scale: [1.4, 1], duration: 500, ease: 'outBack(1.5)' }, T.verdict + 350)
        tl.add(one('.flare'), { opacity: [0.6, 0], r: [24, 100], duration: 900 }, T.verdict + 350)
        // outro
        tl.add(all('.panel'), { opacity: 0, duration: 500, ease: 'inQuad', delay: stagger(80) }, T.outro - 600)
        tl.add(one('.sky'), { scale: 0.56, y: -96, duration: 1300, ease: 'inOutCubic' }, T.outro)
        tl.add(one('.name h2'), { opacity: [0, 1], y: [16, 0], duration: 900 }, T.name)
        tl.add(one('.name p'), { opacity: [0, 1], y: [10, 0], duration: 800 }, T.name + 800)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="orrery" class:ready bind:this={root}>
  <div class="stars"></div>
  <div class="sky">
    <svg viewBox="-400 -300 800 600" width="800" height="600">
      <defs>
        <radialGradient id="orrery-core"><stop offset="0" stop-color="#11211f" /><stop offset="1" stop-color="#0a0c0e" /></radialGradient>
        <linearGradient id="orrery-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#22d3ee" stop-opacity="0" /><stop offset="1" stop-color="#22d3ee" /></linearGradient>
      </defs>
      <circle class="ring" r={R.outer} fill="none" stroke="#3a3d44" />
      <circle class="ring" r={R.band} fill="none" stroke="#2a2c31" />
      {#each planets as p}<circle class="ring" r={p.r} fill="none" stroke="#1f2126" stroke-dasharray="1 5" />{/each}
      <g transform="rotate({band})">
        {#each Array(72) as _, i}<line class="tick" y1={-R.outer} y2={-R.outer + (i % 6 ? 5 : 11)} stroke="#4b4f57" transform="rotate({i * 5})" opacity="0" />{/each}
        {#each signs as s, i}
          <line y1={-R.band} y2={-R.outer} stroke="#2a2c31" transform="rotate({i * 30})" />
          {#if i === LEO}
            <path class="leo" d="M {polar(R.band, i * 30).join(' ')} A {R.band} {R.band} 0 0 1 {polar(R.band, i * 30 + 30).join(' ')} L {polar(R.outer, i * 30 + 30).join(' ')} A {R.outer} {R.outer} 0 0 0 {polar(R.outer, i * 30).join(' ')} Z" fill="#22d3ee" fill-opacity="0.16" stroke="#22d3ee" stroke-opacity="0.6" opacity="0" />
          {/if}
          <text class="sign" transform="rotate({i * 30 + 15}) translate(0 {-(R.band + R.outer) / 2 + 4})" text-anchor="middle" opacity="0" fill={i === LEO && now >= T.aligned ? '#67e8f9' : '#a8acb3'}>{s}</text>
        {/each}
      </g>
      <line class="beam" x1="0" y1={-R.ring} x2="0" y2={-R.outer + 4} stroke="url(#orrery-beam)" stroke-width="2" transform="rotate({AIM})" />
      {#each planets as p, i}
        {@const [x, y] = polar(p.r, angles[i])}
        <g class="planet" opacity="0" transform="translate({x} {y})">
          <circle r={p.size + 5} fill={p.color} opacity="0.12" />
          <circle r={p.size} fill={p.name === 'Mercury' && retro ? '#f87171' : p.color} />
          <text x={p.size + 6} y="3" class="pname" opacity={1 - span(now, T.align, 600)} fill={p.name === 'Mercury' && retro ? '#f87171' : '#8a8f98'}>{p.name === 'Mercury' && retro ? 'Mercury ℞' : p.name}</text>
          {#if p.name === 'Mercury'}<circle class="retro-ring" r="6" fill="none" stroke="#f87171" opacity="0" />{/if}
        </g>
      {/each}
      <circle r={R.disc} fill="url(#orrery-core)" stroke="#2a2c31" />
      {#each final as _, k}
        {@const before = shares.slice(0, k).reduce((a, b) => a + b, 0)}
        <circle r={R.ring} fill="none" stroke={verdictColors[k]} stroke-width="5" stroke-dasharray="{Math.max(0, shares[k] * C - 3)} {C}" stroke-dashoffset={-before * C} transform="rotate(-90)" opacity={now < T.question ? 0 : 0.85} />
      {/each}
      <circle class="flare" r="60" fill="#ffa198" opacity="0" />
    </svg>
    <p class="question">Should we deploy<br />on Friday?</p>
    <p class="answer"><b>NO</b><span>0.02 ms · 0.61</span></p>
  </div>

  <div class="panel moon">
    <h4>Moon</h4>
    <p>
      <svg width="18" height="18" viewBox="-9 -9 18 18"><circle r="8" fill="#2a2c31" /><path d="M0,-8 A8,8 0 0 0 0,8 A3.5,8 0 0 0 0,-8 Z" fill="#e6e7e9" /></svg>
      Waning gibbous
    </p>
  </div>
  <div class="panel mercury"><h4>Mercury</h4><p class="red">℞ Retrograde until Nov 13</p></div>
  <div class="panel omen"><h4>Today's omen</h4><p>{omen}</p></div>
  <div class="panel influence">
    <h4>Astrological influence</h4>
    <p>{needle.toFixed(2)} <small>(fixed)</small></p>
    <i><b style:width="{needle * 100}%"></b></i>
  </div>

  <div class="name">
    <h2>BAdecision</h2>
    <p>Every decision, <em>cosmically</em> aligned.</p>
  </div>
</div>

<style>
  .orrery { position: relative; width: 800px; height: 600px; overflow: hidden; color: var(--soft); font-family: var(--sans); }
  .orrery:not(.ready) > * { visibility: hidden; }
  .orrery > * { position: absolute; }
  .stars { inset: 0; opacity: 0.5; background: radial-gradient(1px 1px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 83% 22%, #fff, transparent), radial-gradient(1px 1px at 64% 81%, #fff, transparent), radial-gradient(1px 1px at 22% 74%, #fff, transparent), radial-gradient(1px 1px at 92% 64%, #fff, transparent), radial-gradient(1px 1px at 6% 52%, #fff, transparent), radial-gradient(1px 1px at 41% 6%, #fff, transparent); }
  .sky { inset: 0; transform-origin: 400px 300px; }
  .sky svg { position: absolute; inset: 0; }
  .sign { font: 500 9.5px var(--mono); letter-spacing: 0.18em; }
  .pname { font: 10px var(--mono); }
  .question, .answer { position: absolute; left: 330px; top: 250px; width: 140px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .question { font-size: 14px; line-height: 1.35; color: var(--ink); opacity: 0; }
  .answer { opacity: 0; }
  .answer b { font: 600 40px/1 var(--sans); letter-spacing: -0.03em; color: #ffa198; }
  .answer span { margin-top: 6px; font: 11px var(--mono); color: var(--muted); }

  .panel { width: 214px; padding: 12px 14px; border: 1px solid var(--edge); border-radius: 10px; background: rgba(12, 13, 15, 0.85); backdrop-filter: blur(6px); opacity: 0; }
  .panel.moon { left: 20px; top: 20px; }
  .panel.mercury { right: 20px; top: 20px; }
  .panel.omen { left: 20px; bottom: 20px; }
  .panel.influence { right: 20px; bottom: 20px; }
  .panel h4 { margin: 0 0 6px; font: 500 10.5px var(--mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
  .panel p { display: flex; align-items: center; gap: 8px; min-height: 20px; font-size: 14px; color: var(--ink-2); }
  .panel small { color: var(--muted); }
  .red { color: #f87171 !important; }
  .panel i { display: block; height: 4px; margin-top: 8px; border-radius: 2px; background: #2a2c31; }
  .panel i b { display: block; height: 100%; border-radius: 2px; background: #22d3ee; }

  .name { left: 0; right: 0; top: 420px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .name h2 { font: 600 64px/1 var(--sans); letter-spacing: -0.045em; color: var(--ink); opacity: 0; }
  .name p { font-size: 19px; color: var(--ink-2); opacity: 0; }
  .name em { font: italic 400 1.15em var(--serif); }
</style>
