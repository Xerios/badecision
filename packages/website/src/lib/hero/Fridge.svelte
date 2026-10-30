<!--
  Hero animation "Fridge": training hardware, compared. First a server farm: racks shaking, power climbing into the
  megawatts, the water-intake gauge in the red, and through the glass windows in the cooling pipes you watch the water
  run dry. The camera pans right to a kitchen, where BAdecision has been training on a smart fridge the whole time. It
  finishes, the door opens, ice cubes tumble out, splash down and melt into puddles: the training run made water. ~18s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, hash, clamp01, span, io3, fmt } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { farm: 600, dry: 1600, capOut: 6600, pan: 6900, panEnd: 8700, cap: 8900, done: 9800, open: 10900, ice: 11500, melt: 12600, made: 13200, end: 18000 }

  // the farm: power, heat and water, all climbing; the shaking grows with them
  const load = $derived(span(now, T.farm, 5200, p => p))
  const mw = $derived(87 * io3(load) + (load > 0 ? Math.sin(now / 37) * 0.6 : 0))
  const temp = $derived(41 + 56 * io3(load))
  const intake = $derived(clamp01(1.25 * io3(span(now, T.farm, 4200, p => p))) + (load > 0 ? Math.sin(now / 29) * 0.03 : 0))
  const shake = $derived(3.4 * load * (now < T.pan + 400 ? 1 : 0))
  const jitter = $derived({ x: Math.sin(now / 23) * shake, y: Math.cos(now / 31) * shake * 0.5 })
  // the water in each pipe window, draining one after another
  const windows = [70, 250, 430, 610]
  const levels = $derived(windows.map((_, i) => 1 - span(now, T.dry + i * 380, 3600, io3)))
  const blink = $derived(Math.floor(now / 260) % 2 === 0)
  const leds = $derived(Math.floor(now / 140))

  // the fridge has been training the whole time
  const EPOCHS = 40
  const epoch = $derived(Math.max(1, Math.min(EPOCHS, Math.ceil(EPOCHS * clamp01(now / T.done)))))
  const lossAt = e => 0.12 + 1.1 * Math.exp(-e / 9) + 0.05 * (hash(e) - 0.5)
  const curve = $derived(Array.from({ length: epoch }, (_, i) => `${(i / (EPOCHS - 1)) * 128},${40 - lossAt(i + 1) * 30}`).join(' '))
  const trained = $derived(now >= T.done)

  // the camera: farm (world x 0..800), then the kitchen (800..1600)
  const pan = $derived(io3(span(now, T.pan, T.panEnd - T.pan, p => p)))

  // ice: tumbles out of the open fridge, bounces once, slides to a stop (screen coordinates in the kitchen)
  const FLOOR = 556
  const cubes = Array.from({ length: 8 }, (_, i) => ({ at: T.ice + i * 110, x: 330 + hash(i * 4.1) * 130, y: 300 + hash(i * 2.7) * 90, vx: 90 + hash(i * 6.3) * 170, spin: (hash(i * 8.8) - 0.5) * 900 }))
  const G = 2600 // px/s²
  const cubeAt = c => {
    const t = (now - c.at) / 1000
    if (t < 0) return null
    const tHit = Math.sqrt((2 * (FLOOR - c.y)) / G)
    const vHit = G * tHit
    let y = FLOOR
    if (t < tHit) y = c.y + 0.5 * G * t * t
    else {
      const b = t - tHit
      const v = -0.32 * vHit
      if (b < (-2 * v) / G) y = FLOOR + v * b + 0.5 * G * b * b
    }
    const slide = Math.min(t, tHit + 0.7)
    const x = c.x + c.vx * (slide - 0.35 * Math.max(0, slide - tHit) ** 2 / 0.7)
    // once down, it starts to melt
    const melt = span(now, c.at + tHit * 1000, 4500, p => p)
    return { x, y, r: c.spin * Math.min(t, tHit + 0.25), s: 1 - 0.25 * melt, o: 1 - 0.3 * melt }
  }
  const ice = $derived(cubes.map(cubeAt))
  // the floor gets wet: a splash where each cube lands, a puddle under each one, and they join up
  const landed = cubes.map(c => {
    const tHit = Math.sqrt((2 * (FLOOR - c.y)) / G)
    return { at: c.at + tHit * 1000, x: c.x + c.vx * (tHit + 0.7 - (0.35 * 0.7 ** 2) / 0.7) }
  })
  const splashes = $derived(
    landed.flatMap((l, i) => {
      const p = (now - l.at) / 380
      if (p < 0 || p > 1) return []
      return [-1.4, -0.5, 0.5, 1.4].map(d => ({ x: l.x + d * 22 * p + (hash(i + d) - 0.5) * 6, y: FLOOR + 2 - 70 * p * (1 - p) * (1 + Math.abs(d) * 0.2), o: 1 - p }))
    }),
  )
  const puddles = $derived(landed.map(l => ({ x: l.x, r: span(now, l.at, 3200) })))
  const sheen = $derived(span(now, T.melt, 4000))
  const wetFrom = Math.min(...landed.map(l => l.x)) - 50
  const wetTo = Math.max(...landed.map(l => l.x)) + 60

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.farm'), { opacity: [0, 1], duration: 700 }, 0)
        tl.add(all('.cap-a p'), { opacity: [0, 1], y: [12, 0], duration: 700, delay: stagger(700) }, 300)
        tl.add(all('.gauges > div'), { opacity: [0, 1], y: [10, 0], duration: 500, delay: stagger(150) }, T.farm)
        tl.add(one('.heat'), { opacity: [0, 1], duration: 5000, ease: 'inQuad' }, T.farm)
        tl.add(one('.cap-a'), { opacity: 0, y: -12, duration: 400, ease: 'inQuad' }, T.capOut)
        tl.add(one('.world'), { filter: [{ to: 'blur(2px)', duration: 900, ease: 'inQuad' }, { to: 'blur(0px)', duration: 900, ease: 'outQuad' }] }, T.pan)
        tl.add(all('.cap-b p'), { opacity: [0, 1], y: [12, 0], duration: 700, delay: stagger(700) }, T.cap)
        tl.add(one('.stats'), { opacity: [0, 1], x: [12, 0], duration: 600 }, T.cap + 900)
        tl.add(one('.screen'), { boxShadow: ['0 0 0 rgba(45,212,191,0)', '0 0 36px rgba(45,212,191,0.5)', '0 0 14px rgba(45,212,191,0.2)'], duration: 900 }, T.done)
        // the door opens: the light comes on before it is fully open
        tl.add(one('.door'), { rotateY: [{ to: 4, duration: 180, ease: 'outQuad' }, { to: -112, duration: 1100, ease: 'outCubic' }] }, T.open)
        tl.add(all('.light'), { opacity: [0, 1], duration: 700, ease: 'outQuad' }, T.open + 250)
        tl.add(one('.cap-b'), { opacity: 0, y: -12, duration: 400, ease: 'inQuad' }, T.made - 500)
        tl.add(one('.water-stat'), { color: ['#d6dae0', '#7dd3fc'], duration: 600 }, T.made)
        tl.add(all('.made > *'), { opacity: [0, 1], y: [14, 0], duration: 800, delay: stagger(900) }, T.made)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="fridge-vs" class:ready bind:this={root}>
  <div class="world" style:transform="translateX({-800 * pan}px)">
    <!-- the farm -->
    <section class="farm">
      <div class="heat"></div>
      <div class="back" style:transform="translateX({pan * 120}px)">
        {#each Array(9) as _, i}<i class="rack small" style:left="{20 + i * 88}px"><b class="leds" style:background-position-y="{((leds + i * 3) % 7) * 6}px"></b></i>{/each}
      </div>
      <div class="racks" style:transform="translate({jitter.x}px, {jitter.y}px)">
        {#each Array(6) as _, i}
          <i class="rack" style:left="{36 + i * 124}px">
            <b class="leds" style:background-position-y="{((leds * (i % 2 ? 1 : 2) + i * 5) % 9) * 7}px"></b>
            <b class="leds two" style:background-position-y="{((leds + i * 2) % 5) * 7}px"></b>
            <em class="fan"></em>
          </i>
        {/each}
        <div class="pipe"></div>
        {#each Array(6) as _, i}<i class="riser" style:left="{80 + i * 124}px"></i>{/each}
        {#each windows as x, i}
          <span class="window" class:dry={levels[i] < 0.04} style:left="{x}px">
            <em style:height="{levels[i] * 100}%" style:background-position-x="{(-now * 0.12) % 40}px"></em>
            {#if levels[i] < 0.04}<small class:on={blink}>DRY</small>{/if}
          </span>
        {/each}
      </div>
      <div class="gauges" style:transform="translate({jitter.x * 0.4}px, {jitter.y * 0.4}px)">
        <div><small>Power draw</small><b>{fmt(Math.max(0, mw), 1)} MW</b><i><em style:width="{(mw / 87) * 100}%"></em></i></div>
        <div class="dial">
          <svg width="150" height="84" viewBox="-75 -75 150 84">
            <path d="M-62 0 A62 62 0 0 1 62 0" class="track" />
            <path d="M31 -53.7 A62 62 0 0 1 62 0" class="red" />
            <line x1="0" y1="0" x2="0" y2="-54" class="needle" transform="rotate({-90 + 180 * Math.min(1.04, intake)})" />
            <circle r="5" class="hub" />
          </svg>
          <small>Water intake <b class:alarm={intake > 0.85 && blink}>{fmt(intake * 2300)} L/s</b></small>
        </div>
        <div><small>GPU temperature</small><b class:hot={temp > 88}>{Math.round(temp)} °C</b><i><em class="t" style:width="{((temp - 30) / 70) * 100}%"></em></i></div>
      </div>
    </section>

    <!-- the kitchen -->
    <section class="kitchen">
      <div class="floor"></div>
      <div class="spill light"></div>
      <div class="fridge">
        <div class="freezer"><i></i></div>
        <div class="inside">
          <div class="glow light"></div>
          <i class="shelf" style:top="92px"></i><i class="shelf" style:top="186px"></i><i class="shelf" style:top="262px"></i>
          <span class="milk"></span><span class="jar"></span>
          {#each Array(4) as _, i}<span class="egg" style:left="{112 + i * 15}px"></span>{/each}
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
          <div class="back-door"></div>
        </div>
      </div>
      <div class="stats">
        <p><small>Power draw</small><b>0.15 kW</b></p>
        <p><small>Water intake</small><b class="water-stat">{now >= T.made ? '−0.4 L' : '0 L/s'}</b></p>
        <p><small>Temperature</small><b>3 °C</b></p>
      </div>
    </section>
  </div>

  <div class="sheen" style:left="{wetFrom}px" style:width="{wetTo - wetFrom}px" style:opacity={sheen} style:transform="scaleX({0.4 + 0.6 * sheen})"></div>
  {#each puddles as w}{#if w.r > 0}<i class="wet" style:left="{w.x}px" style:transform="scale({0.2 + w.r}, {0.3 + w.r * 0.7})" style:opacity={Math.min(1, w.r * 2)}></i>{/if}{/each}
  {#each ice as c}{#if c}<i class="cube" style:transform="translate({c.x}px, {c.y}px) rotate({c.r}deg) scale({c.s})" style:opacity={c.o}></i>{/if}{/each}
  {#each splashes as d}<i class="drop" style:transform="translate({d.x}px, {d.y}px)" style:opacity={d.o}></i>{/each}

  <div class="cap cap-a"><p>Frontier models train on this.</p><p>A server farm with the thirst of a small city.</p></div>
  <div class="cap cap-b"><p>BAdecision trained on this.</p><p>One long-running, high-end <em>smart fridge.</em></p></div>
  <div class="cap made"><p>It actually made water.</p><small>Net water use of the training run: −0.4 L. The ice maker was on.</small></div>
</div>

<style>
  .fridge-vs { position: relative; width: 800px; height: 600px; overflow: hidden; background: #070809; color: var(--soft); font-family: var(--sans); }
  .fridge-vs:not(.ready) > * { visibility: hidden; }
  .fridge-vs > * { position: absolute; }
  .world { left: 0; top: 0; width: 1600px; height: 600px; }
  .world > section { position: absolute; top: 0; width: 800px; height: 600px; overflow: hidden; }
  .world > section > * { position: absolute; }

  /* the farm */
  .farm { left: 0; background: linear-gradient(#0a0c10, #07080b 70%, #0b0b0d); opacity: 0; }
  .heat { inset: 0; background: radial-gradient(700px 300px at 50% 105%, rgba(255, 90, 40, 0.38), transparent 70%); opacity: 0; }
  .back { inset: 0; }
  .racks { inset: 0; }
  .rack { position: absolute; top: 214px; width: 104px; height: 290px; border: 1px solid #2a2e35; border-radius: 4px; background: linear-gradient(90deg, #14171c, #1b1f25 50%, #121419); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5); }
  .rack.small { top: 196px; width: 70px; height: 210px; opacity: 0.35; box-shadow: none; }
  .leds { position: absolute; left: 12px; top: 14px; width: 34px; bottom: 60px; background: radial-gradient(circle, #34d399 1.6px, transparent 2.2px) 0 0 / 8px 7px, radial-gradient(circle, #fbbf24 1.4px, transparent 2px) 4px 3px / 16px 21px; }
  .leds.two { left: auto; right: 12px; width: 34px; background: radial-gradient(circle, #60a5fa 1.6px, transparent 2.2px) 0 0 / 8px 7px, radial-gradient(circle, #f87171 1.4px, transparent 2px) 2px 5px / 24px 28px; }
  .small .leds { left: 8px; right: 8px; width: auto; bottom: 30px; }
  .fan { position: absolute; left: 50%; bottom: 10px; width: 36px; height: 36px; margin-left: -18px; border-radius: 50%; background: repeating-conic-gradient(#2a2e35 0 30deg, #0d0f12 30deg 60deg); }
  .pipe { left: 0; right: 0; top: 520px; height: 26px; border-radius: 4px; background: linear-gradient(#5b6470, #3a414b 45%, #262b32); box-shadow: 0 6px 14px rgba(0, 0, 0, 0.6); }
  .riser { position: absolute; top: 500px; width: 14px; height: 22px; background: linear-gradient(90deg, #3a414b, #5b6470, #3a414b); }
  .window { position: absolute; top: 516px; width: 92px; height: 34px; border: 3px solid #8b94a1; border-radius: 9px; background: rgba(170, 200, 230, 0.08); overflow: hidden; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.5); }
  .window em { position: absolute; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.25) 0 2px, transparent 2px 40px), linear-gradient(#5cc8ff, #1e78c8); }
  .window::after { content: ''; position: absolute; left: 6px; right: 40%; top: 4px; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.35); }
  .window.dry { background: repeating-linear-gradient(115deg, rgba(120, 86, 50, 0.35) 0 3px, rgba(60, 44, 30, 0.35) 3px 9px); }
  .window small { position: absolute; inset: 0; display: grid; place-items: center; font: 700 11px var(--mono); letter-spacing: 0.12em; color: #7f1d1d; }
  .window small.on { color: #f87171; text-shadow: 0 0 8px rgba(248, 113, 113, 0.8); }
  .gauges { left: 30px; right: 30px; top: 106px; display: grid; grid-template-columns: 1fr 170px 1fr; gap: 14px; align-items: stretch; }
  .gauges > div { display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 10px 14px; border: 1px solid #2a2e35; border-radius: 10px; background: rgba(14, 16, 20, 0.9); opacity: 0; }
  .gauges small { font: 11px var(--mono); color: var(--muted); }
  .gauges > div > b { font: 600 24px var(--mono); color: var(--ink); font-variant-numeric: tabular-nums; }
  .gauges b.hot { color: #f87171; }
  .gauges i { display: block; height: 5px; border-radius: 3px; background: #23262c; overflow: hidden; }
  .gauges i em { display: block; height: 100%; background: linear-gradient(90deg, #fbbf24, #f97316); }
  .gauges i em.t { background: linear-gradient(90deg, #fbbf24, #ef4444); }
  .dial { align-items: center; padding: 6px 8px 8px; }
  .dial small { text-align: center; }
  .dial small b { display: block; margin-top: 2px; font: 600 14px var(--mono); color: #7dd3fc; font-variant-numeric: tabular-nums; }
  .dial small b.alarm { color: #f87171; }
  .track { fill: none; stroke: #2a2e35; stroke-width: 10; }
  .red { fill: none; stroke: #ef4444; stroke-width: 10; opacity: 0.8; }
  .needle { stroke: #f7f8f8; stroke-width: 3; stroke-linecap: round; }
  .hub { fill: #f7f8f8; }

  /* the kitchen */
  .kitchen { left: 800px; background: radial-gradient(500px 380px at 50% 40%, #13161a, #070809); box-shadow: inset 12px 0 30px rgba(0, 0, 0, 0.8); }
  .floor { left: 0; right: 0; top: 560px; bottom: 0; background: linear-gradient(#0d0f11, #060708); border-top: 1px solid #1d1f23; }
  .spill { left: 170px; top: 560px; width: 460px; height: 80px; background: radial-gradient(240px 60px at 40% 0%, rgba(255, 236, 190, 0.35), transparent); opacity: 0; }

  .fridge { left: 295px; top: 110px; width: 210px; height: 450px; border: 1px solid #2c2f34; border-radius: 16px; background: linear-gradient(90deg, #15171a, #1c1f23 60%, #131518); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6); perspective: 900px; }
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

  .door { position: absolute; left: 0; right: 0; top: 120px; height: 330px; transform-origin: left center; transform-style: preserve-3d; }
  .front, .back-door { position: absolute; inset: 0; border-radius: 0 0 16px 16px; backface-visibility: hidden; }
  .front { background: linear-gradient(90deg, #16181b, #1e2125 60%, #141619); border-top: 2px solid #0b0c0e; }
  .back-door { transform: rotateY(180deg); background: linear-gradient(90deg, #d8d2c2, #bfb8a6); border: 6px solid #a8a190; }
  .handle { top: 34px; height: 120px; }
  .screen { position: absolute; left: 18px; top: 24px; width: 164px; padding: 9px 10px; border: 1px solid #23262b; border-radius: 8px; background: #040506; font: 9.5px/1.45 var(--mono); color: #8a8f98; }
  .screen .head { color: #5eead4; letter-spacing: 0.04em; }
  .screen .big { font-size: 12.5px; color: var(--ink); }
  .screen .ok { color: #5eead4; }
  .screen svg { display: block; margin: 4px 0; }
  .foot { color: #4b4f57; }
  .stats { left: 540px; top: 230px; width: 220px; display: flex; flex-direction: column; gap: 8px; opacity: 0; }
  .stats p { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 12px; border: 1px solid #23262b; border-radius: 9px; background: rgba(14, 16, 20, 0.85); }
  .stats small { font: 11px var(--mono); color: var(--muted); }
  .stats b { font: 600 15px var(--mono); color: #d6dae0; font-variant-numeric: tabular-nums; }

  .sheen { top: 558px; height: 26px; border-radius: 50%; background: radial-gradient(closest-side, rgba(125, 211, 252, 0.32), rgba(125, 211, 252, 0.1) 70%, transparent), linear-gradient(90deg, transparent 15%, rgba(255, 244, 214, 0.22) 30%, transparent 45%) 0 45% / 100% 3px no-repeat; transform-origin: 30% 50%; opacity: 0; }
  .wet { top: 559px; width: 64px; height: 12px; margin-left: -32px; border-radius: 50%; background: radial-gradient(closest-side, rgba(150, 215, 250, 0.6), rgba(125, 211, 252, 0.2) 65%, transparent); }
  .drop { left: 0; top: 0; width: 4px; height: 5px; margin: -2.5px -2px; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; background: #bfe6ff; box-shadow: 0 0 4px rgba(150, 215, 250, 0.7); }
  .cube { left: 0; top: 0; width: 20px; height: 20px; margin: -10px; border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 5px; background: linear-gradient(135deg, rgba(240, 250, 255, 0.85), rgba(165, 215, 245, 0.55)); box-shadow: inset -3px -3px 6px rgba(70, 140, 200, 0.35), 0 0 10px rgba(180, 225, 255, 0.35); }

  .cap { left: 0; right: 0; top: 30px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
  .cap p { font: 600 30px/1.2 var(--sans); letter-spacing: -0.035em; color: var(--ink); opacity: 0; }
  .cap p + p { font-size: 19px; font-weight: 500; letter-spacing: -0.01em; color: var(--soft); }
  .cap em { font: italic 400 1.15em var(--serif); color: #5eead4; }
  .made p { font-size: 34px; color: #7dd3fc; }
  .made small { font: 13px var(--mono); color: var(--soft); opacity: 0; }
</style>
