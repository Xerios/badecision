<!--
  Hero animation "Keynote": launch-event kinetic type. 10,000 decisions a day; four possible answers; why do they take
  meetings; 20 µs; $0.00, 0%, 0; runs anywhere, including your fridge; it reads your horoscope; introducing. ~21.5s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, hash, span, fmt } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const S = [0, 2900, 6200, 10700, 13800, 17100, 20800, 23700] // scene starts; each holds ~1s after its last beat
  const END = 28700
  const verdicts = [['yes.', '#8ee6ae'], ['no.', '#ffa198'], ['maybe.', '#fcd34d'], ['not sure.', '#c9ccd1']]
  const slow = ['three meetings', 'two weeks', 'a frontier LLM']
  const runtimes = ['Node.', 'Deno.', 'Bun.', 'the browser.', 'your fridge.']
  const hits = [['$0.00', 'per decision.'], ['0%', 'hallucination.'], ['0', 'dependencies.']]

  const decisions = $derived(Math.round(10000 * span(now, 350, 1300)))
  const micro = $derived(Math.max(20, 10 ** (5.623 * (1 - span(now, S[3] + 500, 1000))) * 20))
  const latency = $derived(micro >= 1e6 ? `${(micro / 1e6).toFixed(1)} s` : micro >= 1000 ? `${fmt(micro / 1000)} ms` : `${fmt(micro)} µs`)
  const sparkles = Array.from({ length: 16 }, (_, i) => ({ x: 120 + hash(i) * 560, y: 140 + hash(i * 3) * 320, s: 8 + hash(i * 5) * 12 }))

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        const enter = (sel, at, extra = {}) => tl.add(all(sel), { opacity: [0, 1], y: [24, 0], duration: 600, ease: 'outQuart', delay: stagger(90), ...extra }, at)
        const exit = (sel, at) => tl.add(one(sel), { opacity: 0, y: -28, filter: ['blur(0px)', 'blur(6px)'], duration: 380, ease: 'inQuad' }, at - 150)

        // 1. scale of the problem
        enter('.s1 > *', 150)
        exit('.s1', S[1] - 350)
        // 2. the answer space
        tl.set(one('.s2'), { opacity: 1 }, S[1])
        enter('.s2 h3', S[1])
        tl.add(all('.s2 .v'), { opacity: [0, 1], scale: [1.6, 1], duration: 420, ease: 'outBack(1.7)', delay: stagger(300) }, S[1] + 450)
        exit('.s2', S[2] - 350)
        // 3. why so slow: each guess struck out
        tl.set(one('.s3'), { opacity: 1 }, S[2])
        enter('.s3 h3', S[2])
        all('.s3 .slot span').forEach((el, i) => {
          const at = S[2] + 450 + i * 1000
          tl.add(el, { opacity: [0, 1], y: [40, 0], duration: 380, ease: 'outQuart' }, at)
          tl.add(el.querySelector('i'), { scaleX: [0, 1], duration: 260, ease: 'inOutQuad' }, at + 420)
          tl.add(el, { opacity: i < 2 ? 0 : 0.35, y: i < 2 ? -20 : 0, scale: i < 2 ? 0.94 : 1, duration: 200, ease: 'inQuad' }, at + 680)
        })
        exit('.s3', S[3] - 350)
        // 4. the number
        tl.set(one('.s4'), { opacity: 1 }, S[3])
        enter('.s4 h3', S[3])
        tl.add(one('.s4 b'), { opacity: [0, 1], scale: [0.85, 1], duration: 500 }, S[3] + 300)
        tl.add(one('.s4 b'), { color: ['#f7f8f8', '#5eead4'], textShadow: ['0 0 0px rgba(45,212,191,0)', '0 0 40px rgba(45,212,191,0.45)'], duration: 400 }, S[3] + 1500)
        enter('.s4 p', S[3] + 1600)
        exit('.s4', S[4] - 350)
        // 5. three hits, each one shakes the room
        tl.set(one('.s5'), { opacity: 1 }, S[4])
        all('.s5 p').forEach((el, i) => {
          const at = S[4] + 150 + i * 650
          tl.add(el, { opacity: [0, 1], scale: [1.5, 1], duration: 300, ease: 'inQuad' }, at)
          tl.add(one('.s5'), { x: [{ to: -6, duration: 40 }, { to: 5, duration: 40 }, { to: -2, duration: 50 }, { to: 0, duration: 60 }] }, at + 300)
        })
        exit('.s5', S[5] - 350)
        // 6. runs anywhere
        tl.set(one('.s6'), { opacity: 1 }, S[5])
        enter('.s6 h3', S[5])
        all('.s6 .slot span').forEach((el, i, list) => {
          const at = S[5] + 400 + i * 420
          tl.add(el, { opacity: [0, 1], y: [36, 0], duration: 220, ease: 'outQuad' }, at)
          if (i < list.length - 1) tl.add(el, { opacity: 0, y: -36, duration: 200, ease: 'inQuad' }, at + 260)
        })
        exit('.s6', S[6] - 350)
        // 7. deadpan
        tl.set(one('.s7'), { opacity: 1 }, S[6])
        enter('.s7 h3, .s7 h2', S[6], { duration: 900, delay: stagger(500) })
        tl.add(all('.spark'), { opacity: [0, 0.9, 0.25], scale: [0, 1], rotate: [0, 90], duration: 900, delay: stagger(60, { from: 'random' }) }, S[6] + 700)
        exit('.s7', S[7] - 350)
        // 8. introducing
        tl.set(one('.s8'), { opacity: 1 }, S[7])
        tl.add(one('.s8 small'), { opacity: [0, 1], duration: 600 }, S[7])
        tl.add(one('.s8 h2'), { opacity: [0, 1], letterSpacing: ['0.08em', '-0.05em'], filter: ['blur(12px)', 'blur(0px)'], duration: 1300, ease: 'outExpo' }, S[7] + 800)
        tl.add(all('.s8 .pills > *'), { opacity: [0, 1], y: [10, 0], duration: 600, delay: stagger(200) }, S[7] + 2000)
        return END
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="keynote" class:ready bind:this={root}>
  <div class="glow" style:transform="translate({Math.sin(now / 2400) * 60}px, {Math.cos(now / 3100) * 40}px)"></div>

  <section class="s1">
    <h3>Your company makes</h3>
    <h2><b>{fmt(decisions)}</b> decisions</h2>
    <p>every day.</p>
  </section>

  <section class="s2">
    <h3>Every one of them is</h3>
    <h2>{#each verdicts as [w, c]}<span class="v" style:color={c}>{w}</span>{/each}</h2>
  </section>

  <section class="s3">
    <h3>So why does each one take</h3>
    <div class="slot">{#each slow as w}<span>{w}<i></i></span>{/each}</div>
  </section>

  <section class="s4">
    <h3>BAdecision takes</h3>
    <b>{latency}</b>
    <p>On-device. WebAssembly. SIMD.</p>
  </section>

  <section class="s5">
    {#each hits as [n, w]}<p><b>{n}</b> {w}</p>{/each}
  </section>

  <section class="s6">
    <h3>It runs on</h3>
    <div class="slot">{#each runtimes as w, i}<span class:fridge={i === runtimes.length - 1}>{w}</span>{/each}</div>
  </section>

  <section class="s7">
    <h3>And yes,</h3>
    <h2>it reads your <em>horoscope.</em></h2>
    {#each sparkles as s}<i class="spark" style:left="{s.x}px" style:top="{s.y}px" style:font-size="{s.s}px">✦</i>{/each}
  </section>

  <section class="s8">
    <small>Introducing</small>
    <h2>BAdecision 2.0</h2>
    <div class="pills"><span>now with <code>seriously</code></span><code>npm install badecision</code></div>
  </section>
</div>

<style>
  .keynote { position: relative; width: 800px; height: 600px; overflow: hidden; background: #050506; color: var(--ink); font-family: var(--sans); }
  .keynote:not(.ready) > * { visibility: hidden; }
  .keynote > * { position: absolute; }
  .glow { left: 100px; top: 60px; width: 600px; height: 480px; background: radial-gradient(closest-side, rgba(45, 212, 191, 0.09), rgba(125, 211, 252, 0.04) 60%, transparent); }

  section { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; opacity: 0; }
  .s1 { opacity: 1; }
  .s1 > * { opacity: 0; }
  h3 { font-size: 30px; font-weight: 500; letter-spacing: -0.03em; color: var(--muted); opacity: 0; }
  h2 { font-size: 72px; font-weight: 600; line-height: 1.05; letter-spacing: -0.05em; }
  .s1 b { font-family: var(--mono); font-weight: 500; letter-spacing: -0.06em; font-variant-numeric: tabular-nums; }
  .s1 p { font-size: 30px; color: var(--muted); letter-spacing: -0.03em; }
  .s2 h2 { display: flex; gap: 22px; font-size: 60px; }
  .v { display: inline-block; opacity: 0; }

  .slot { position: relative; width: 760px; height: 90px; }
  .slot span { position: absolute; left: 0; right: 0; top: 0; font-size: 68px; font-weight: 600; letter-spacing: -0.05em; line-height: 90px; opacity: 0; }
  .slot i { position: absolute; left: 50%; top: 50%; width: 0; height: 6px; margin-top: -1px; border-radius: 3px; background: #f87171; transform-origin: left center; transform: scaleX(0); }
  .s3 .slot span:nth-child(1) i { width: 500px; margin-left: -250px; }
  .s3 .slot span:nth-child(2) i { width: 330px; margin-left: -165px; }
  .s3 .slot span:nth-child(3) i { width: 480px; margin-left: -240px; }
  .fridge { font-family: var(--serif); font-style: italic; font-weight: 400 !important; letter-spacing: -0.02em !important; color: #5eead4; }

  .s4 b { font: 500 128px/1 var(--mono); letter-spacing: -0.07em; font-variant-numeric: tabular-nums; opacity: 0; }
  .s4 p { font: 15px var(--mono); letter-spacing: 0.08em; color: var(--muted); opacity: 0; }

  .s5 { gap: 6px; }
  .s5 p { font-size: 56px; font-weight: 600; letter-spacing: -0.05em; opacity: 0; }
  .s5 b { font-family: var(--mono); font-weight: 500; color: #5eead4; letter-spacing: -0.06em; }

  .s7 h2 { font-size: 60px; }
  .s7 em { font: italic 400 1.2em var(--serif); letter-spacing: -0.02em; color: #c4a7ff; }
  .s7 h2 { opacity: 0; }
  .spark { position: absolute; color: #c4a7ff; font-style: normal; opacity: 0; }

  .s8 small { font-size: 22px; color: var(--muted); opacity: 0; }
  .s8 h2 { font-size: 88px; opacity: 0; }
  .pills { display: flex; gap: 12px; margin-top: 10px; }
  .pills > * { padding: 9px 16px; border: 1px solid var(--edge-strong); border-radius: 999px; background: var(--panel); font-size: 15px; color: var(--ink-2); opacity: 0; }
  .pills span code { color: #5eead4; }
</style>
