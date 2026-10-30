<!--
  Hero animation "Cookie" (800×340): a cookie banner, a human cursor that cannot decide between Reject all and Accept
  all, and BAdecision, who adds the missing button: Maybe all. ~11s.
-->
<script>
  import { onMount } from 'svelte'
  import { play, clamp01, io3 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { banner: 500, ext: 5200, decide: 5900, click: 6700, toast: 7200, caption: 8400, end: 11400 }
  // the human: Reject, Accept, Reject, Accept, faster, then gives up
  const path = [
    [900, 640, 380],
    [1700, 604, 292],
    [2300, 712, 292],
    [2800, 604, 292],
    [3200, 712, 292],
    [3500, 604, 292],
    [3750, 712, 292],
    [3950, 604, 292],
    [4150, 712, 292],
    [4700, 600, 200],
    [5300, 764, 26],
    [6300, 764, 26],
    [6700, 708, 292],
  ]
  const cursor = $derived.by(() => {
    const k = path.findIndex(p => p[0] > now)
    if (k === -1) return path.at(-1).slice(1)
    if (k === 0) return path[0].slice(1)
    const [t0, x0, y0] = path[k - 1]
    const [t1, x1, y1] = path[k]
    const p = io3(clamp01((now - t0) / (t1 - t0)))
    return [x0 + (x1 - x0) * p, y0 + (y1 - y0) * p]
  })
  const decided = $derived(now >= T.decide)

  onMount(() =>
    play(
      root,
      (tl, { one }) => {
        tl.add(one('.banner'), { y: [160, 0], duration: 600, ease: 'outCubic' }, T.banner)
        tl.add(one('.ext'), { opacity: [0, 1], scale: [0.6, 1], duration: 400, ease: 'outBack(2)' }, T.ext)
        tl.add(one('.ext'), { backgroundColor: ['#5eead4', '#0f3d3a'], duration: 400 }, T.decide - 300)
        tl.add(one('.maybe'), { opacity: [0, 1], width: [0, 130], duration: 400, ease: 'outBack(1.4)' }, T.decide)
        tl.add(
          one('.maybe'),
          {
            scale: [
              { to: 0.92, duration: 80 },
              { to: 1, duration: 200 },
            ],
          },
          T.click,
        )
        tl.add(one('.banner'), { y: 180, duration: 500, ease: 'inQuad' }, T.click + 250)
        tl.add(one('.toast'), { opacity: [0, 1], y: [-12, 0], duration: 500 }, T.toast)
        tl.add(one('.caption'), { opacity: [0, 1], y: [10, 0], duration: 700 }, T.caption)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="cookie" class:ready bind:this={root}>
  <div class="site">
    <header><b>acme.news</b><span class="ext" title="BAdecision">÷</span></header>
    <h3>Local man unable to decide on cookies, day 3</h3>
    {#each Array(5) as _, i}<i style:width="{90 - i * 9}%"></i>{/each}
  </div>
  <div class="banner">
    <p><b>We value your privacy 🍪</b> We and our <u>847 partners</u> use cookies to personalise ads, measure you, and remember that you said no.</p>
    <div class="buttons">
      <button type="button" tabindex="-1">Reject all</button>
      <button type="button" tabindex="-1" class="primary">Accept all</button>
      <button type="button" tabindex="-1" class="maybe">Maybe all</button>
    </div>
  </div>
  <p class="toast">✓ Consented to <b>423</b> of 847 partners, weighted by the model.</p>
  <p class="caption">Decision fatigue, solved. <small>{decided ? 'in 0.02 ms' : ''}</small></p>
  {#if now < T.click + 400}
    <svg class="cursor" width="22" height="26" viewBox="0 0 26 30" style:transform="translate({cursor[0]}px, {cursor[1]}px)"
      ><path d="M2 2 L2 24 L8 18 L12 27 L16 25 L12 17 L20 17 Z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round" /></svg
    >
  {/if}
</div>

<style>
  .cookie {
    position: relative;
    width: 800px;
    height: 340px;
    overflow: hidden;
    background: #f3f4f6;
    font-family: var(--sans);
    color: #111;
  }
  .cookie:not(.ready) > * {
    visibility: hidden;
  }
  .cookie > * {
    position: absolute;
  }
  .site {
    inset: 0;
    padding: 0 40px;
  }
  .site header {
    height: 46px;
    margin: 0 -40px 20px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
  }
  .site h3 {
    margin-bottom: 14px;
    color: #111;
    font: 700 26px var(--serif);
  }
  .site i {
    display: block;
    height: 10px;
    margin-bottom: 12px;
    border-radius: 5px;
    background: #e1e7f1;
  }
  .ext {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #0f3d3a;
    color: #5eead4;
    font-weight: 700;
    opacity: 0;
  }
  .banner {
    left: 0;
    right: 0;
    bottom: 0;
    padding: 18px 28px;
    display: flex;
    align-items: center;
    gap: 22px;
    background: #fff;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.18);
  }
  .banner p {
    flex: 1;
    font-size: 13px;
    line-height: 1.5;
    color: #374151;
  }
  .banner b {
    display: block;
    margin-bottom: 2px;
    color: #111;
    font-size: 15px;
  }
  .buttons {
    display: flex;
    gap: 10px;
  }
  button {
    min-height: 40px;
    padding: 0 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    color: #111;
    font: 600 13px var(--sans);
    white-space: nowrap;
    overflow: hidden;
  }
  button.primary {
    border-color: #111;
    background: #111;
    color: #fff;
  }
  button.maybe {
    width: 0;
    padding: 0;
    border-color: #0f766e;
    background: #14b8a6;
    color: #042f2e;
    opacity: 0;
  }
  .toast {
    left: 50%;
    top: 64px;
    translate: -50% 0;
    padding: 10px 16px;
    border-radius: 10px;
    background: #111;
    color: #fff;
    font-size: 14px;
    white-space: nowrap;
    opacity: 0;
  }
  .toast b {
    color: #5eead4;
  }
  .caption {
    left: 0;
    right: 0;
    top: 150px;
    text-align: center;
    font: 800 44px var(--sans);
    letter-spacing: -0.04em;
    color: #111;
    opacity: 0;
  }
  .caption small {
    display: block;
    font: 14px var(--mono);
    letter-spacing: 0;
    color: #0f766e;
  }
  .cursor {
    left: 0;
    top: 0;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
  }
</style>
