<!--
  Hero animation "Premium" (800×450): the answer arrives in 0.02 ms and nobody trusts it. Product asks for a loader.
  Enterprise mode: five seconds of consulting stakeholders, aligning synergies and reading the horoscope, then the same
  answer, now in gold. ~14s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, clamp01, typeOut } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { type: 300, fast: 1900, note: 3000, rerun: 5000, steps: 5400, answer: 10600, caption: 11800, end: 14600 }
  const call = "isIt('Approve refund #4821?')"
  const steps = ['Consulting stakeholders…', 'Aligning synergies…', 'Scheduling a meeting about the meeting…', 'Reading the horoscope…', 'Pretending to think…']
  const STEP = 1000
  const progress = $derived(clamp01((now - T.steps) / (steps.length * STEP)))

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.card'), { opacity: [0, 1], y: [12, 0], duration: 500 }, 0)
        tl.add(one('.fast'), { opacity: [0, 1], duration: 150 }, T.fast)
        tl.add(one('.note'), { opacity: [0, 1], scale: [1.3, 1], rotate: [8, 3], duration: 450, ease: 'outBack(1.8)' }, T.note)
        tl.add(one('.fast'), { opacity: 0, duration: 300 }, T.rerun - 300)
        tl.add(one('.note'), { opacity: 0, x: 40, duration: 400, ease: 'inQuad' }, T.rerun - 200)
        tl.add(one('.mode'), { opacity: [0, 1], scale: [0.8, 1], duration: 400, ease: 'outBack(2)' }, T.rerun)
        tl.add(one('.loader'), { opacity: [0, 1], duration: 300 }, T.steps - 200)
        all('.step').forEach((el, i) => {
          tl.add(el, { opacity: [0, 1], x: [-8, 0], duration: 250 }, T.steps + i * STEP)
          tl.add(el.querySelector('b'), { opacity: [0, 1], scale: [0, 1], duration: 250, ease: 'outBack(2)' }, T.steps + i * STEP + 800)
        })
        tl.add(one('.gold'), { opacity: [0, 1], scale: [0.9, 1], duration: 600, ease: 'outBack(1.4)' }, T.answer)
        tl.add(one('.caption'), { opacity: [0, 1], y: [8, 0], duration: 700 }, T.caption)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="premium" class:ready bind:this={root}>
  <section class="card">
    <p class="call"><span>›</span> {typeOut(call, now, T.type, 45)}{#if now >= T.rerun}<span class="mode">{'{ mode: "enterprise" }'}</span>{/if}</p>
    <p class="fast">→ <b>yes</b> <small>0.02 ms</small></p>
    <div class="loader">
      {#each steps as s}<p class="step">{s}<b>✓</b></p>{/each}
      <i><em style:width="{progress * 100}%"></em></i>
    </div>
    <p class="gold">→ <b>yes</b> <small>5.02 s · of which 0.02 ms was the decision</small></p>
  </section>
  <p class="note">Users don't trust answers this fast. Can we add a loader? — Product</p>
  <p class="caption">Now with artificial latency, for enterprise trust.</p>
</div>

<style>
  .premium { position: relative; width: 800px; height: 450px; overflow: hidden; background: radial-gradient(500px 300px at 50% 30%, #1a1708, #08080a); font-family: var(--sans); color: var(--soft); }
  .premium:not(.ready) > * { visibility: hidden; }
  .premium > * { position: absolute; }
  .card { left: 110px; top: 40px; width: 580px; height: 320px; padding: 24px 28px; border: 1px solid var(--edge-strong); border-radius: 14px; background: var(--panel); opacity: 0; }
  .call { font: 18px var(--mono); color: var(--ink-2); }
  .call span:first-child { color: var(--muted); }
  .mode { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 6px; background: rgba(224, 181, 67, 0.15); color: #e0b543; font-size: 14px; opacity: 0; }
  .fast { position: absolute; left: 28px; top: 74px; font: 30px var(--mono); color: var(--muted); opacity: 0; }
  .fast b, .gold b { color: #8ee6ae; font-weight: 500; }
  .fast small, .gold small { font-size: 13px; color: var(--muted); }
  .loader { margin-top: 26px; opacity: 0; }
  .step { display: flex; justify-content: space-between; padding: 4px 0; font: 14px var(--mono); color: var(--soft); opacity: 0; }
  .step b { color: #7ee2a8; opacity: 0; }
  .loader i { display: block; height: 6px; margin-top: 12px; border-radius: 3px; background: #2a2c31; overflow: hidden; }
  .loader em { display: block; height: 100%; background: linear-gradient(90deg, #a16207, #fde68a); }
  .gold { position: absolute; left: 28px; right: 28px; bottom: 22px; padding: 10px 14px; border: 1px solid #e0b543; border-radius: 10px; background: linear-gradient(90deg, rgba(224, 181, 67, 0.16), rgba(224, 181, 67, 0.04)); font: 28px var(--mono); color: #e0b543; opacity: 0; transform-origin: left center; }
  .note { right: 30px; top: 150px; width: 210px; padding: 14px; background: #fde68a; color: #422006; font: 600 15px/1.35 var(--sans); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); opacity: 0; }
  .caption { left: 0; right: 0; bottom: 34px; text-align: center; font: 700 26px var(--sans); letter-spacing: -0.03em; color: var(--ink); opacity: 0; }
</style>
