<!--
  Hero animation "8-Ball": a magic 8-ball answers "Reply hazy, try again". A "Powered by BAdecision" sticker goes on;
  the ball answers 50,000 times a second until it cracks and shatters, leaving the answer floating. ~13s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger, createDrawable } from 'animejs'
  import { play, hash, span, io3, fmt } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { question: 300, drop: 900, shake: 2000, turn: 3000, hazy: 3700, sticker: 5300, frenzy: 6100, crack: 7600, shatter: 9100, caption: 10200, end: 13500 }
  const answers = ['YES', 'NO', 'MAYBE', 'NOT SURE']
  const turn = $derived(span(now, T.turn, 700, io3))
  const frenzy = $derived(now >= T.frenzy && now < T.shatter)
  const answer = $derived(now >= T.shatter ? ['MAYBE'] : frenzy ? [answers[Math.floor(now / 45) % 4]] : ['REPLY HAZY,', 'TRY', 'AGAIN'])
  const amp = $derived(frenzy ? 1 + 7 * span(now, T.frenzy, T.shatter - T.frenzy, p => p * p) : 0)
  const jitter = $derived(amp ? [(hash(Math.floor(now / 16)) - 0.5) * 2 * amp, (hash(Math.floor(now / 16) + 7) - 0.5) * 2 * amp] : [0, 0])
  const rate = $derived(Math.round(50000 * span(now, T.frenzy, 1200)))
  const shards = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + hash(i) * 0.3
    const b = a + 0.3 + hash(i * 3) * 0.25
    const r = 175
    return { points: `0,0 ${Math.cos(a) * r},${Math.sin(a) * r} ${Math.cos(b) * r},${Math.sin(b) * r}`, dx: Math.cos(a + 0.2) * (240 + hash(i * 5) * 160), dy: Math.sin(a + 0.2) * (240 + hash(i * 5) * 160), rot: (hash(i * 7) - 0.5) * 220 }
  })

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.question'), { opacity: [0, 1], y: [12, 0], duration: 700 }, T.question)
        tl.set(one('.ball'), { y: -500 }, 0)
        tl.add(one('.ball'), { opacity: { to: 1, duration: 200 }, y: [{ to: 0, duration: 700, ease: 'inQuad' }, { to: -26, duration: 220, ease: 'outQuad' }, { to: 0, duration: 220, ease: 'inQuad' }] }, T.drop)
        tl.add(one('.ball'), { rotate: [{ to: -10, duration: 110 }, { to: 9, duration: 110 }, { to: -8, duration: 110 }, { to: 7, duration: 110 }, { to: -4, duration: 110 }, { to: 0, duration: 150 }], x: [{ to: -14, duration: 110 }, { to: 14, duration: 110 }, { to: -10, duration: 110 }, { to: 8, duration: 110 }, { to: 0, duration: 260 }] }, T.shake)
        tl.add(one('.tri'), { opacity: [0, 1], duration: 900, ease: 'inOutSine' }, T.hazy)
        tl.add(one('.note'), { opacity: [0, 1], duration: 600 }, T.hazy + 300)
        tl.add(one('.sticker'), { opacity: [0, 1], scale: [2.2, 1], rotate: [-30, -12], duration: 420, ease: 'outBack(1.6)' }, T.sticker)
        tl.add(one('.ball'), { scale: [{ to: 0.96, duration: 90 }, { to: 1, duration: 260, ease: 'outBack(2)' }] }, T.sticker + 300)
        tl.add(one('.note'), { opacity: 0, duration: 300 }, T.frenzy - 300)
        tl.add(one('.rate'), { opacity: [0, 1], duration: 400 }, T.frenzy)
        all('.crack').forEach((el, i) => tl.add(createDrawable(el, 0, 0), { draw: '0 1', duration: 260, ease: 'outQuad' }, T.crack + i * 450))
        all('.crack').forEach((_, i) => tl.add(one('.flash'), { opacity: [0.35, 0], duration: 260 }, T.crack + i * 450))
        // shatter: the glass flies apart, the answer stays
        tl.add(one('.shell'), { opacity: 0, duration: 120 }, T.shatter)
        all('.shard').forEach((el, i) => tl.add(el, { opacity: [{ to: 1, duration: 1 }, { to: 0, duration: 900, ease: 'inQuad' }], x: shards[i].dx, y: shards[i].dy, rotate: shards[i].rot, duration: 1000, ease: 'outCubic' }, T.shatter))
        tl.add(one('.rate'), { opacity: 0, duration: 400 }, T.shatter)
        tl.add(one('.tri'), { scale: [1, 1.5], filter: ['drop-shadow(0 0 0 rgba(45,212,191,0))', 'drop-shadow(0 0 30px rgba(45,212,191,0.8))'], duration: 900, ease: 'outBack(1.4)' }, T.shatter + 100)
        tl.add(one('.question'), { opacity: 0.35, duration: 600 }, T.shatter)
        tl.add(one('.caption'), { opacity: [0, 1], y: [14, 0], duration: 800 }, T.caption)
        tl.add(one('.caption small'), { opacity: [0, 1], duration: 700 }, T.caption + 700)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="eight" class:ready bind:this={root}>
  <p class="question">Will this deploy go well?</p>
  <div class="ball" style:translate="{jitter[0]}px {jitter[1]}px">
    <svg class="shell" viewBox="-180 -180 360 360" width="360" height="360">
      <defs>
        <radialGradient id="eight-glass" cx="-0.25" cy="-0.3" r="1.1"><stop offset="0" stop-color="#4a4f57" /><stop offset="0.35" stop-color="#16181b" /><stop offset="1" stop-color="#000" /></radialGradient>
      </defs>
      <circle r="170" fill="url(#eight-glass)" />
      <ellipse cx="-60" cy="-92" rx="58" ry="28" fill="#fff" opacity="0.1" transform="rotate(-30 -60 -92)" />
      <g transform="translate({-170 * turn} {-150 * turn}) scale({1 - turn})"><circle r="72" fill="#f4f4f4" /><text y="30" text-anchor="middle" class="eight-8">8</text></g>
      <circle r={74 * turn} cx={150 * (1 - turn)} cy={150 * (1 - turn)} fill="#0b1440" stroke="#000" stroke-width="5" />
      <path class="crack" d="M -20 -168 L -8 -120 L -30 -90 L -4 -60" fill="none" stroke="#e6e7e9" stroke-width="2" />
      <path class="crack" d="M 160 50 L 118 40 L 100 72 L 70 64 L 58 90" fill="none" stroke="#e6e7e9" stroke-width="2" />
      <path class="crack" d="M -150 80 L -110 70 L -96 100 L -60 96 L -40 130 L -10 120" fill="none" stroke="#e6e7e9" stroke-width="2.5" />
      <circle class="flash" r="170" fill="#fff" opacity="0" />
    </svg>
    <svg class="shards" viewBox="-180 -180 360 360" width="360" height="360">
      {#each shards as s}<polygon class="shard" points={s.points} fill="#121418" stroke="#3a3d44" opacity="0" />{/each}
    </svg>
    <svg class="tri" viewBox="-80 -70 160 140" width="160" height="140" opacity="0">
      <polygon points="-64,-46 64,-46 0,62" fill="#2949d8" />
      {#each answer as line, i}<text y={-22 + i * 15 - (answer.length - 1) * 4} text-anchor="middle" class:big={answer.length === 1}>{line}</text>{/each}
    </svg>
    <span class="sticker">Powered by<b>BAdecision</b></span>
  </div>
  <p class="note">Magic 8-Ball · 1 answer per shake</p>
  <p class="rate"><b>{fmt(rate)}</b> answers / s</p>
  <p class="caption">Upgrade your oracle.<small>BAdecision · 4 answers, 50,000 per second</small></p>
</div>

<style>
  .eight { position: relative; width: 800px; height: 600px; overflow: hidden; background: radial-gradient(520px 400px at 50% 55%, #1b1530, #07070b); color: var(--soft); font-family: var(--sans); }
  .eight:not(.ready) > * { visibility: hidden; }
  .eight > * { position: absolute; }
  .question { left: 0; right: 0; top: 40px; text-align: center; font: 600 32px var(--sans); letter-spacing: -0.035em; color: var(--ink); opacity: 0; }
  .ball { left: 220px; top: 140px; width: 360px; height: 360px; opacity: 0; }
  .ball svg { position: absolute; left: 0; top: 0; overflow: visible; }
  .eight-8 { font: 700 84px var(--sans); fill: #000; }
  .shard { transform-box: fill-box; transform-origin: center; }
  .tri { left: 100px !important; top: 110px !important; }
  .tri text { font: 700 11px var(--sans); letter-spacing: 0.06em; fill: #dbe4ff; }
  .tri text.big { font-size: 17px; }
  .sticker { right: -10px; bottom: 26px; position: absolute; padding: 8px 14px; border-radius: 10px; background: #5eead4; color: #042f2e; font: 600 11px/1.2 var(--sans); text-align: center; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5); opacity: 0; }
  .sticker b { display: block; font-size: 16px; letter-spacing: -0.02em; }
  .note, .rate { left: 0; right: 0; top: 524px; text-align: center; font: 14px var(--mono); color: var(--muted); opacity: 0; }
  .rate b { font-size: 22px; color: #5eead4; font-weight: 500; }
  .caption { left: 0; right: 0; top: 500px; display: flex; flex-direction: column; align-items: center; gap: 8px; font: 600 36px var(--sans); letter-spacing: -0.04em; color: var(--ink); opacity: 0; }
  .caption small { font: 14px var(--mono); letter-spacing: 0; color: var(--muted); opacity: 0; }
</style>
