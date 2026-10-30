<!--
  Hero animation "Reliable" (800×450): the same question ten times, ten different answers, ten passing tests. The
  dashboard agrees: consistently inconsistent. A reliable non-deterministic system. ~15s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, typeOut } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const answers = ['yes', 'no', 'maybe', 'yes', 'not sure', 'no', 'maybe', 'maybe', 'yes', 'no']
  const color = { yes: '#8ee6ae', no: '#ffa198', maybe: '#fcd34d', 'not sure': '#c9ccd1' }
  const T = { type: 300, runs: 2000, stats: 6800, sla: 8600, punch: 10600, end: 15000 }
  const cmd = "for i in {1..10}; do npx badecision 'Is BAdecision reliable?'; done"
  const typed = $derived(typeOut(cmd, now, T.type, 22))
  const PER = 380

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.term'), { opacity: [0, 1], duration: 400 }, 0)
        all('.run').forEach((el, i) => tl.add(el, { opacity: [0, 1], x: [-6, 0], duration: 200 }, T.runs + i * PER))
        tl.add(all('.stat'), { opacity: [0, 1], y: [12, 0], duration: 500, delay: stagger(220) }, T.stats)
        tl.add(one('.badge'), { opacity: [0, 1], scale: [1.6, 1], rotate: [-12, -5], duration: 450, ease: 'outBack(1.8)' }, T.stats + 1000)
        tl.add(one('.sla'), { opacity: [0, 1], y: [10, 0], duration: 600 }, T.sla)
        tl.add(all('.term, .panel'), { opacity: 0.08, filter: ['blur(0px)', 'blur(2px)'], duration: 700 }, T.punch - 300)
        tl.add(one('.punch b'), { opacity: [0, 1], y: [14, 0], duration: 800 }, T.punch)
        tl.add(one('.punch small'), { opacity: [0, 1], duration: 700 }, T.punch + 1300)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="reliable" class:ready bind:this={root}>
  <section class="term">
    <p class="cmd"><span>$</span> {typed}</p>
    {#each answers as a, i}
      <p class="run"><span class="n">#{String(i + 1).padStart(2, '0')}</span><b style:color={color[a]}>{a}</b><span class="ms">0.0{2 + (i % 3)} ms</span><span class="ok">✓ test passed</span></p>
    {/each}
  </section>
  <section class="panel">
    <div class="stat"><small>Same input</small><b>10 / 10</b></div>
    <div class="stat"><small>Same output</small><b class="bad">0 / 10</b></div>
    <div class="stat"><small>Tests passing</small><b class="good">100%</b></div>
    <div class="stat"><small>Reliability</small><b class="good">100%</b></div>
    <p class="badge">✓ Consistently inconsistent</p>
    <p class="sla">SLA: <b>Should Likely Answer</b> · 99.99% of the time it answers something.</p>
  </section>
  <p class="punch"><b>Reliably non-deterministic.</b><small>The only thing it’s sure about is that it’s not sure.</small></p>
</div>

<style>
  .reliable { position: relative; width: 800px; height: 450px; overflow: hidden; background: #08090b; font-family: var(--sans); color: var(--soft); }
  .reliable:not(.ready) > * { visibility: hidden; }
  .reliable > * { position: absolute; }
  .term { left: 24px; top: 24px; width: 440px; height: 402px; padding: 16px 18px; border: 1px solid var(--edge-strong); border-radius: 10px; background: #0b0b0c; font: 13px/1.5 var(--mono); opacity: 0; }
  .cmd { min-height: 40px; color: var(--ink-2); white-space: pre-wrap; }
  .cmd span { color: #7ee2a8; }
  .run { margin-top: 6px; display: grid; grid-template-columns: 40px 90px 70px 1fr; align-items: center; opacity: 0; }
  .n, .ms { color: var(--muted); }
  .run b { font-weight: 500; font-size: 15px; }
  .ok { color: #7ee2a8; }
  .panel { left: 484px; top: 24px; width: 292px; height: 402px; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: min-content; gap: 12px; }
  .stat { padding: 14px; border: 1px solid var(--edge); border-radius: 10px; background: var(--panel); opacity: 0; }
  .stat small { display: block; font: 11px var(--mono); letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .stat b { font: 500 24px var(--mono); color: var(--ink); }
  .bad { color: #ffa198 !important; }
  .good { color: #7ee2a8 !important; }
  .badge { grid-column: span 2; justify-self: center; margin-top: 8px; padding: 8px 14px; border: 3px solid #7ee2a8; border-radius: 10px; color: #7ee2a8; font: 800 17px var(--sans); opacity: 0; }
  .sla { grid-column: span 2; font-size: 13px; line-height: 1.5; color: var(--muted); opacity: 0; }
  .sla b { color: var(--ink-2); }
  .punch { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
  .punch b { color: var(--ink); font: 700 50px/1.1 var(--sans); letter-spacing: -0.045em; opacity: 0; }
  .punch small { font: italic 22px var(--serif); color: var(--soft); opacity: 0; }
</style>
