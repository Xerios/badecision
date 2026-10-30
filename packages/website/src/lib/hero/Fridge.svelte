<!--
  Hero animation "Fridge": the model card is honest about the training hardware. A smart fridge finishes training, the
  door opens, and the model, a 3.5 KB WebAssembly chip, floats out of the light. The facts, the name. ~20s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, hash, clamp01, span } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { cap: 700, train: 1000, done: 7000, captionsOut: 7900, push: 8200, open: 8900, chip: 11000, facts: 12700, factsOut: 15900, name: 16700, end: 20500 }
  const EPOCHS = 40
  const epoch = $derived(Math.max(1, Math.min(EPOCHS, Math.ceil(EPOCHS * clamp01((now - T.train) / (T.done - T.train))))))
  const lossAt = e => 0.12 + 1.1 * Math.exp(-e / 9) + 0.05 * (hash(e) - 0.5)
  const curve = $derived(Array.from({ length: epoch }, (_, i) => `${(i / (EPOCHS - 1)) * 128},${40 - lossAt(i + 1) * 30}`).join(' '))
  const trained = $derived(now >= T.done)
  const PUSH = 1.12

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.fridge'), { opacity: [0, 1], y: [20, 0], duration: 900 }, 0)
        tl.add(all('.caption p'), { opacity: [0, 1], y: [12, 0], duration: 700, delay: stagger(1100) }, T.cap)
        tl.add(one('.screen'), { boxShadow: ['0 0 0 rgba(45,212,191,0)', '0 0 36px rgba(45,212,191,0.5)', '0 0 14px rgba(45,212,191,0.2)'], duration: 900 }, T.done)
        tl.add(one('.caption'), { opacity: 0, y: -12, duration: 500, ease: 'inQuad' }, T.captionsOut)
        // push in, open the door: the light comes on before the door is fully open
        tl.add(one('.scene'), { scale: PUSH, duration: 1400, ease: 'inOutCubic' }, T.push)
        tl.add(one('.door'), { rotateY: [{ to: 4, duration: 180, ease: 'outQuad' }, { to: -112, duration: 1100, ease: 'outCubic' }] }, T.open)
        tl.add(all('.light'), { opacity: [0, 1], duration: 700, ease: 'outQuad' }, T.open + 250)
        // the chip floats out of the fridge to the front
        const chip = one('.chip')
        const s = root.getBoundingClientRect()
        const k = s.width / 600
        const r = chip.getBoundingClientRect()
        const cx = (r.left + r.width / 2 - s.left) / k
        const cy = (r.top + r.height / 2 - s.top) / k
        const from = [300 + (cx - 300) * PUSH - 300, 370 + (cy - 370) * PUSH - 250]
        tl.add(one('.scene'), { opacity: 0.16, filter: ['blur(0px)', 'blur(3px)'], duration: 1200, ease: 'inOutSine' }, T.chip + 300)
        tl.set(chip, { opacity: 0 }, T.chip)
        tl.set(one('.hero-chip'), { opacity: 1, x: from[0], y: from[1], scale: (r.width / k) * PUSH / 280, rotate: -8 }, T.chip)
        tl.add(one('.hero-chip'), { x: 0, y: [{ to: from[1] - 30, duration: 500, ease: 'outQuad' }, { to: 0, duration: 1000, ease: 'inOutCubic' }], scale: 1, rotate: 0, duration: 1500, ease: 'inOutCubic' }, T.chip + 1)
        tl.add(one('.hero-chip'), { boxShadow: ['0 0 0px rgba(45,212,191,0)', '0 0 80px rgba(45,212,191,0.45)'], duration: 1200 }, T.chip + 600)
        tl.add(all('.facts p'), { opacity: [0, 1], y: [14, 0], duration: 700, delay: stagger(1100) }, T.facts)
        tl.add(one('.facts'), { opacity: 0, y: -10, duration: 500, ease: 'inQuad' }, T.factsOut)
        tl.add(one('.hero-chip'), { scale: 0.62, y: -96, duration: 1000, ease: 'inOutCubic' }, T.factsOut + 200)
        tl.add(one('.name h2'), { opacity: [0, 1], y: [18, 0], duration: 900 }, T.name)
        tl.add(one('.name p'), { opacity: [0, 1], y: [10, 0], duration: 800 }, T.name + 700)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="kitchen" class:ready bind:this={root}>
  <div class="scene">
    <div class="floor"></div>
    <div class="spill light"></div>
    <div class="fridge">
      <div class="freezer"><i></i></div>
      <div class="inside">
        <div class="glow light"></div>
        <i class="shelf" style:top="92px"></i><i class="shelf" style:top="186px"></i><i class="shelf" style:top="262px"></i>
        <span class="milk"></span><span class="jar"></span>
        {#each Array(4) as _, i}<span class="egg" style:left="{112 + i * 15}px"></span>{/each}
        <span class="chip"><span class="mark"></span></span>
        <span class="box"></span>
      </div>
      <div class="door">
        <div class="front">
          <div class="screen">
            <p class="head">badecision · trainer</p>
            {#if trained}
              <p class="big ok">Training complete ✓</p>
              <p>76% accurate*</p>
            {:else}
              <p class="big">epoch {epoch}/{EPOCHS}</p>
              <p>loss {lossAt(epoch).toFixed(4)}</p>
            {/if}
            <svg width="128" height="42"><polyline points={curve} fill="none" stroke="#5eead4" stroke-width="1.5" /></svg>
            <p class="foot">3°C · 0.6 kWh · door closed</p>
          </div>
          <i class="handle"></i>
        </div>
        <div class="back"></div>
      </div>
    </div>
  </div>

  <div class="caption"><p>Our model was trained on</p><p>one long-running, high-end <em>smart fridge.</em></p></div>

  <div class="hero-chip"><span class="mark"></span><b>badecision.wasm</b><small>3.5 KB · SIMD</small></div>
  <div class="facts"><p>Compiled to 3.5 KB of WebAssembly.</p><p>0 dependencies. ~20 µs per decision.</p></div>

  <div class="name">
    <h2>BAdecision</h2>
    <p>Trained on a fridge. Ready for <em>production.</em></p>
  </div>
</div>

<style>
  .kitchen { position: relative; width: 600px; height: 600px; overflow: hidden; background: radial-gradient(500px 380px at 50% 40%, #13161a, #070809); color: var(--soft); font-family: var(--sans); }
  .kitchen:not(.ready) > * { visibility: hidden; }
  .kitchen > * { position: absolute; }
  .scene { inset: 0; transform-origin: 300px 370px; }
  .scene > * { position: absolute; }
  .floor { left: 0; right: 0; top: 560px; bottom: 0; background: linear-gradient(#0d0f11, #060708); border-top: 1px solid #1d1f23; }
  .spill { left: 70px; top: 560px; width: 460px; height: 80px; background: radial-gradient(240px 60px at 40% 0%, rgba(255, 236, 190, 0.35), transparent); opacity: 0; }

  .fridge { left: 195px; top: 110px; width: 210px; height: 450px; border: 1px solid #2c2f34; border-radius: 16px; background: linear-gradient(90deg, #15171a, #1c1f23 60%, #131518); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6); perspective: 900px; opacity: 0; }
  .freezer { position: absolute; left: 0; right: 0; top: 0; height: 118px; border-bottom: 2px solid #0b0c0e; border-radius: 16px 16px 0 0; }
  .freezer i, .handle { position: absolute; right: 14px; width: 5px; border-radius: 3px; background: linear-gradient(90deg, #3a3e45, #5a5f68); }
  .freezer i { top: 40px; height: 54px; }
  .inside { position: absolute; left: 6px; right: 6px; top: 124px; height: 318px; border-radius: 6px; background: #0b0c0d; overflow: hidden; }
  .glow { position: absolute; inset: 0; background: radial-gradient(160px 220px at 50% 10%, #fff7e2, #e9d9ae 45%, #9c8a5e); opacity: 0; }
  .shelf { position: absolute; left: 0; right: 0; height: 3px; background: rgba(255, 255, 255, 0.55); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25); }
  .inside span { position: absolute; }
  .milk { left: 18px; top: 36px; width: 30px; height: 56px; border-radius: 3px 3px 2px 2px; background: linear-gradient(#f4f4f4 0 55%, #3b82f6 55% 70%, #f4f4f4 70%); }
  .jar { left: 60px; top: 58px; width: 30px; height: 34px; border-radius: 6px; background: #b45309; box-shadow: inset 0 6px 0 #7c2d12; }
  .egg { top: 172px; width: 12px; height: 14px; border-radius: 50% 50% 46% 46%; background: #f3e7d3; }
  .box { left: 120px; top: 222px; width: 60px; height: 40px; border-radius: 4px; background: #9a3412; }
  .chip { left: 28px; top: 156px; width: 54px; height: 30px; border: 1px solid #2dd4bf; border-radius: 5px; background: #0b1f1d; box-shadow: 0 0 18px rgba(45, 212, 191, 0.6); display: grid; place-items: center; }

  .door { position: absolute; left: 0; right: 0; top: 120px; height: 330px; transform-origin: left center; transform-style: preserve-3d; }
  .front, .back { position: absolute; inset: 0; border-radius: 0 0 16px 16px; backface-visibility: hidden; }
  .front { background: linear-gradient(90deg, #16181b, #1e2125 60%, #141619); border-top: 2px solid #0b0c0e; }
  .back { transform: rotateY(180deg); background: linear-gradient(90deg, #d8d2c2, #bfb8a6); border: 6px solid #a8a190; }
  .handle { top: 34px; height: 120px; }
  .screen { position: absolute; left: 18px; top: 24px; width: 164px; padding: 9px 10px; border: 1px solid #23262b; border-radius: 8px; background: #040506; font: 9.5px/1.45 var(--mono); color: #8a8f98; }
  .screen .head { color: #5eead4; letter-spacing: 0.04em; }
  .screen .big { font-size: 12.5px; color: var(--ink); }
  .screen .ok { color: #5eead4; }
  .screen svg { display: block; margin: 4px 0; }
  .foot { color: #4b4f57; }

  .caption { left: 0; right: 0; top: 34px; display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; }
  .caption p { font: 600 30px/1.2 var(--sans); letter-spacing: -0.035em; color: var(--ink); opacity: 0; }
  .caption p:first-child { font-size: 22px; font-weight: 500; color: var(--muted); }
  .caption em { font: italic 400 1.15em var(--serif); color: #5eead4; }

  .hero-chip { left: 160px; top: 180px; width: 280px; height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border: 2px solid #2dd4bf; border-radius: 16px; background: linear-gradient(145deg, #0e2a27, #071513); opacity: 0; }
  .hero-chip::before, .hero-chip::after { content: ''; position: absolute; top: 22px; bottom: 22px; width: 14px; background: repeating-linear-gradient(#2dd4bf 0 4px, transparent 4px 12px); }
  .hero-chip::before { left: -16px; }
  .hero-chip::after { right: -16px; }
  .hero-chip b { font: 500 20px var(--mono); color: var(--ink); }
  .hero-chip small { font: 13px var(--mono); color: #5eead4; }
  .mark { width: 22px; height: 22px; border: 2px solid #5eead4; border-radius: 6px; position: relative; display: inline-block; }
  .mark::before { content: ''; position: absolute; left: 4px; right: 4px; top: 8px; height: 2px; background: #5eead4; }
  .chip .mark { width: 14px; height: 14px; border-width: 1.5px; border-radius: 4px; }
  .chip .mark::before { left: 2px; right: 2px; top: 5px; height: 1.5px; }

  .facts { left: 0; right: 0; top: 380px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
  .facts p { font: 600 30px/1.2 var(--sans); letter-spacing: -0.035em; color: var(--ink); opacity: 0; }
  .facts p + p { font: 500 20px var(--mono); letter-spacing: -0.02em; color: var(--soft); }

  .name { left: 0; right: 0; top: 330px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .name h2 { font: 600 72px/1 var(--sans); letter-spacing: -0.045em; color: var(--ink); opacity: 0; }
  .name p { font-size: 20px; color: var(--ink-2); opacity: 0; }
  .name em { font: italic 400 1.15em var(--serif); }
</style>
