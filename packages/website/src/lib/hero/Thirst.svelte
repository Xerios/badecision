<!--
  Hero animation "Thirst": two glasses of water, a frontier LLM and BAdecision, one question. BAdecision answers at
  once and its glass stays full (it gets an umbrella). The LLM drinks its glass through a straw while it thinks, gets
  refilled from a bottle, a jug, a water cooler and a water tower, and answers "It depends." Thinking is thirsty work.
  Deciding isn't. ~17s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, clamp01, span, out3, io3, typeOut, fmt } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const question = 'Should we deploy on Friday?'
  // the LLM's glass: drained through the straw, refilled from ever bigger sources, drained faster each time
  const drains = [
    [2600, 500, null],
    [1800, 1500, '+ 1 bottle'],
    [1300, 5000, '+ 1 jug'],
    [1000, 19000, '+ 1 water cooler'],
    [800, 1926000, '+ 1 water tower'],
  ]
  const REFILL = 500
  const phases = []
  let t0 = 2200
  for (const [i, [dur, ml, source]] of drains.entries()) {
    if (source) {
      phases.push({ refill: true, start: t0, dur: REFILL, source })
      t0 += REFILL
    }
    phases.push({ start: t0, dur, ml, i })
    t0 += dur
  }
  const T = { send: 1500, bad: 1600, think: 2200, umbrella: 5600, answer: t0 + 200 }
  T.caption = T.answer + 1700
  T.end = T.caption + 3600

  const phase = $derived(phases.findLast(p => p.start <= now && now < p.start + p.dur))
  const p = $derived(phase ? (now - phase.start) / phase.dur : 0)
  const level = $derived(now < T.think ? 1 : !phase ? 0 : phase.refill ? out3(p) : 1 - io3(p))
  const drinking = $derived(phase && !phase.refill)
  const used = $derived(phases.filter(f => f.ml && f.start <= now).reduce((a, f) => a + f.ml * io3(clamp01((now - f.start) / f.dur)), 0))
  const amount = ml => (ml < 1000 ? `${Math.round(ml)} mL` : `${fmt(ml / 1000, ml < 10000 ? 1 : 0)} L`)
  const thoughts = ['Considering the question…', 'Reading 89 files in /MyPhotos/…', 'Cooling the GPUs…', 'Weighing both sides…', 'Consulting a bigger model…', 'Re-evaluating previous conclusions…', 'Rehydrating…', 'Almost there…', 'Almost there…', 'Almost there…']
  const status = $derived(now < T.think ? 'Ready' : now < T.answer ? thoughts[Math.min(thoughts.length - 1, Math.floor((now - T.think) / 900))] : `Answered in ${((T.answer - T.send) / 1000).toFixed(1)} s`)
  const slurp = $derived(drinking ? (p > 0.82 ? 'sssllrrrp' : (now - phase.start) % 800 < 380 ? 'slurp' : '') : '')

  // water surfaces, in glass coordinates (200×260): full at y 40, empty at y 234
  const surface = (l, amp, speed, phase) => {
    const y = 234 - l * 194
    const pts = []
    for (let x = 20; x <= 180; x += 8) pts.push(`${x},${(y + amp * Math.sin(x / 22 + (now / 1000) * speed + phase)).toFixed(1)}`)
    return `M${pts.join(' L')} L180,260 L20,260 Z`
  }
  const ripple = $derived(1.2 + 5 * (1 - span(now, T.bad, 900)) * (now >= T.bad ? 1 : 0))
  const glasses = $derived([
    { name: 'Frontier LLM', water: surface(level, drinking ? 3.5 : 2, drinking ? 6 : 2, 0) },
    { name: 'BAdecision', water: surface(1, ripple, 2.2, 1.7) },
  ])

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.ask'), { opacity: [0, 1], y: [10, 0], duration: 500 }, 0)
        tl.add(all('.glass'), { opacity: [0, 1], y: [24, 0], duration: 700, delay: stagger(120) }, 150)
        tl.add(one('.chip.bad'), { opacity: [0, 1], scale: [0.6, 1], duration: 450, ease: 'outBack(2)' }, T.bad)
        tl.add(one('.straw'), { opacity: [0, 1], y: [-60, 0], rotate: [-8, 0], duration: 500, ease: 'outBack(1.4)' }, T.think - 500)
        tl.add(one('.umbrella'), { opacity: [0, 1], y: [-150, 0], rotate: [-40, 16], duration: 900, ease: 'outBounce' }, T.umbrella)
        tl.add(one('.chip.llm'), { opacity: [0, 1], scale: [0.6, 1], duration: 450, ease: 'outBack(2)' }, T.answer)
        tl.add(one('.scene'), { opacity: 0.14, filter: ['blur(0px)', 'blur(3px)'], duration: 800 }, T.caption - 300)
        tl.add(all('.caption > *'), { opacity: [0, 1], y: [14, 0], duration: 800, delay: stagger(800) }, T.caption)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="thirst" class:ready bind:this={root}>
  <div class="scene">
    <p class="ask">{now >= T.send ? question : typeOut(question, now, 400, 40)}<i class:sent={now >= T.send}>↑</i></p>
    {#each glasses as g, i}
      <div class="glass" class:bad={i === 1} style:left="{150 + i * 300}px">
        <svg width="200" height="260" viewBox="0 0 200 260">
          <defs><clipPath id="thirst-in-{i}"><path d="M26 14 L174 14 L161 228 Q160 234 154 234 L46 234 Q40 234 39 228 Z" /></clipPath></defs>
          <path class="cup" d="M20 8 L180 8 L166 232 Q165 240 157 240 L43 240 Q35 240 34 232 Z" />
          <g clip-path="url(#thirst-in-{i})">
            <path class="water" d={g.water} />
            {#if i === 1}
              <rect class="ice" x="62" y={52 + Math.sin(now / 600) * 2} width="34" height="30" rx="7" transform="rotate(-12 79 67)" />
              <rect class="ice" x="104" y={58 + Math.sin(now / 700 + 1) * 2} width="30" height="28" rx="7" transform="rotate(9 119 72)" />
            {/if}
          </g>
          <path class="shine" d="M40 24 L52 220" />
          {#if i === 0}
            <g class="straw">
              <path d="M138 -46 L104 226" />
              {#if drinking}<path class="sip" d="M138 -46 L104 226" style:stroke-dashoffset={(now * 0.35).toFixed(0)} />{/if}
            </g>
            {#if phase?.refill}
              <rect class="pour" x="64" y="-96" width="10" height={330 - level * 194} rx="5" />
              <text class="source" x="69" y="-106">{phase.source}</text>
            {/if}
            {#if slurp}<text class="slurp" x="150" y="-40" transform="rotate(-10 150 -40)">{slurp}</text>{/if}
          {:else}
            <g class="umbrella">
              <path d="M150 -2 L132 70" class="stick" />
              <path d="M112 -6 Q150 -46 188 2 Q176 -8 168 0 Q158 -10 150 -2 Q140 -10 130 -2 Q122 -10 112 -6 Z" class="canopy" />
            </g>
          {/if}
        </svg>
        <p class="name">{g.name}</p>
        <p class="meter">Water used <b>{i === 0 ? amount(used) : '0 mL'}</b></p>
        <p class="status">{i === 0 ? status : now >= T.bad ? 'Answered in 20 µs' : 'Ready'}</p>
      </div>
    {/each}
    <p class="chip bad" style:left="550px"><b>no.</b></p>
    <p class="chip llm" style:left="250px"><b>It depends.</b></p>
  </div>
  <div class="caption">
    <b>Thinking is thirsty work.</b>
    <em>Deciding isn't.</em>
    <small>BAdecision · 0 mL per decision</small>
  </div>
</div>

<style>
  .thirst { position: relative; width: 800px; height: 600px; overflow: hidden; background: radial-gradient(600px 380px at 50% 60%, #0b1620, #06080b); font-family: var(--sans); color: var(--soft); }
  .thirst:not(.ready) > * { visibility: hidden; }
  .thirst > * { position: absolute; }
  .scene { inset: 0; }
  .ask { position: absolute; left: 50%; top: 36px; translate: -50% 0; min-width: 300px; display: flex; justify-content: space-between; gap: 16px; padding: 10px 10px 10px 18px; border: 1px solid var(--edge-strong); border-radius: 999px; background: #121418; color: var(--ink); font-size: 16px; opacity: 0; }
  .ask i { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; background: #2a2c31; color: var(--muted); font-style: normal; font-size: 13px; }
  .ask i.sent { background: var(--ink); color: #111; }
  .glass { position: absolute; top: 200px; width: 200px; display: flex; flex-direction: column; align-items: center; opacity: 0; }
  .glass svg { overflow: visible; }
  .cup { fill: rgba(255, 255, 255, 0.035); stroke: rgba(255, 255, 255, 0.4); stroke-width: 2; }
  .water { fill: rgba(56, 189, 248, 0.55); }
  .bad .water { fill: rgba(94, 234, 212, 0.45); }
  .ice { fill: rgba(240, 253, 250, 0.35); stroke: rgba(255, 255, 255, 0.55); stroke-width: 1; }
  .shine { fill: none; stroke: rgba(255, 255, 255, 0.14); stroke-width: 6; stroke-linecap: round; }
  .straw { opacity: 0; transform-box: fill-box; transform-origin: 50% 100%; }
  .straw path { fill: none; stroke: #f472b6; stroke-width: 10; stroke-linecap: round; }
  .straw .sip { stroke: #7dd3fc; stroke-width: 4; stroke-dasharray: 12 10; }
  .pour { fill: rgba(125, 211, 252, 0.75); }
  .source { fill: #7dd3fc; font: 12px var(--mono); text-anchor: middle; }
  .slurp { fill: #f9a8d4; font: italic 600 16px var(--sans); }
  .umbrella { opacity: 0; transform-box: fill-box; transform-origin: 50% 100%; }
  .canopy { fill: #fb923c; stroke: #fdba74; stroke-width: 1.5; }
  .stick { stroke: #e7d3b5; stroke-width: 3; stroke-linecap: round; }
  .name { margin-top: 18px; font: 600 17px var(--sans); color: var(--ink); }
  .bad .name { color: #5eead4; }
  .meter { margin-top: 6px; font: 12.5px var(--mono); color: var(--muted); }
  .meter b { color: var(--ink-2); font-weight: 500; font-variant-numeric: tabular-nums; }
  .bad .meter b { color: #5eead4; }
  .status { margin-top: 6px; font: italic 15px var(--serif); color: var(--soft); white-space: nowrap; }
  .chip { position: absolute; top: 98px; translate: -50% 0; padding: 6px 16px; border-radius: 10px; font: 600 20px var(--mono); opacity: 0; }
  .chip.bad { background: rgba(94, 234, 212, 0.12); border: 1px solid rgba(94, 234, 212, 0.5); color: #5eead4; }
  .chip.llm { background: rgba(196, 167, 255, 0.12); border: 1px solid rgba(196, 167, 255, 0.45); color: #c4a7ff; }
  .caption { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; }
  .caption > * { opacity: 0; }
  .caption b { font: 800 52px var(--sans); letter-spacing: -0.045em; color: var(--ink); }
  .caption em { font: italic 56px var(--serif); color: #5eead4; }
  .caption small { margin-top: 14px; font: 13px var(--mono); letter-spacing: 0.06em; color: var(--muted); }
</style>
