<!--
  Hero animation "Sprint": the 100 m final. On your marks, get set, and BAdecision has already finished. The others
  run past the scorch marks and smoke it left in its lane; the frontier LLM is still thinking. Results, then the ruling: disqualified for answering before the question. ~13.5s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, hash, clamp01, io3 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { marks: 700, set: 2100, early: 2900, go: 3600, results: 8900, dq: 10400, appeal: 11500, end: 13800 }
  const START = 150
  const FINISH = 690
  const lanes = [
    { name: 'Frontier LLM (thinking)', color: '#c4a7ff', run: t => Math.min(24, (t - T.go) / 60) - Math.max(0, (t - T.go - 2200) / 90) },
    { name: 'Leading decision model', color: '#7dd3fc', run: t => (FINISH - START) * io3(clamp01((t - T.go) / 3100)) },
    { name: 'BAdecision', color: '#5eead4', run: t => (t >= T.early ? FINISH - START + 20 : 0) },
  ]
  const call = $derived(now < T.marks ? '' : now < T.set ? 'On your marks…' : now < T.go ? 'Get set…' : now < T.go + 900 ? 'GO!' : '')
  const x = i => START + Math.max(0, lanes[i].run(now))
  const bob = i => (now > T.go && i === 1 && x(i) < FINISH ? Math.abs(Math.sin(now / 70 + i)) * -5 : 0)
  const thinking = $derived(now > T.go + 400 && now < T.results)
  // BAdecision's run: a light streak, glowing embers that cool into scorch marks, and smoke rising off the lane
  const END = FINISH + 20
  const cool = $derived(now < T.early ? 0 : 1 - clamp01((now - T.early) / 2600))
  const flicker = $derived(0.85 + 0.15 * Math.sin(now / 37) * Math.sin(now / 53))
  const smoke = $derived(
    now < T.early
      ? []
      : Array.from({ length: 12 }, (_, k) => {
          const p = (now - T.early - k * 60) / 2600
          if (p < 0 || p > 1) return null
          return { x: START + ((END - START) * (k + 0.5)) / 12 + (hash(k) - 0.5) * 20 + p * 18, y: 54 - 70 * p - hash(k + 9) * 10, s: 0.6 + p * 1.8, o: (1 - p) * 0.4 * Math.min(1, p * 8) }
        }).filter(Boolean),
  )

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.track'), { opacity: [0, 1], duration: 600 }, 0)
        tl.add(one('.call'), { scale: [{ to: 1.2, duration: 120 }, { to: 1, duration: 200 }] }, T.go)
        tl.add(one('.flash'), { opacity: [0.9, 0], duration: 500 }, T.early)
        tl.add(one('.photo'), { opacity: [0, 1], scale: [1.3, 1], rotate: [8, 4], duration: 400, ease: 'outBack(1.5)' }, T.early + 150)
        tl.add(one('.photo'), { opacity: 0, duration: 300 }, T.go + 1400)
        tl.add(one('.track'), { opacity: 0.15, filter: ['blur(0px)', 'blur(2px)'], duration: 600 }, T.results - 300)
        tl.add(one('.board'), { opacity: [0, 1], y: [20, 0], duration: 600 }, T.results)
        tl.add(all('.board li'), { opacity: [0, 1], x: [-14, 0], duration: 400, delay: stagger(180) }, T.results + 300)
        tl.add(one('.dq'), { opacity: [0, 1], scale: [2.4, 1], duration: 260, ease: 'inQuad' }, T.dq)
        tl.add(one('.board'), { x: [{ to: -6, duration: 50 }, { to: 5, duration: 50 }, { to: 0, duration: 80 }] }, T.dq + 260)
        tl.add(one('.appeal'), { opacity: [0, 1], scale: [1.8, 1], duration: 260, ease: 'inQuad' }, T.appeal)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="sprint" class:ready bind:this={root}>
  <div class="track">
    <p class="call" class:go={call === 'GO!'}>{call}</p>
    {#each lanes as l, i}
      <div class="lane" style:top="{170 + i * 112}px">
        <span class="label">{l.name}</span>
        {#if i === 2 && now >= T.early}
          <i class="scorch" style:left="{START - 10}px" style:width="{END - START - 6}px"></i>
          <i class="skid" style:left="{START - 22}px"></i>
          <i class="skid end" style:left="{END - 46}px"></i>
          <i class="ember" style:left="{START}px" style:width="{END - START - 18}px" style:opacity={cool * flicker}></i>
          <i class="streak" style:left="{START}px" style:width="{END - START - 18}px" style:opacity={clamp01(1 - (now - T.early) / 700)}></i>
          {#each smoke as m}<i class="smoke" style:left="{m.x}px" style:top="{m.y}px" style:opacity={m.o} style:transform="scale({m.s})"></i>{/each}
        {/if}
        <i class="runner" style:left="{x(i)}px" style:top="{37 + bob(i)}px" style:background={l.color}>{i === 2 ? '÷' : l.name[0]}</i>
        {#if i === 0 && thinking}<span class="bubble" style:left="{x(0) + 26}px">thinking…</span>{/if}
      </div>
    {/each}
    <i class="finish"></i>
    <div class="flash"></div>
    <p class="photo">PHOTO FINISH<small>00.00002 s · before the gun</small></p>
  </div>

  <div class="board">
    <h3>Men's & models' 100 m · Final</h3>
    <ol>
      <li><b>1</b> BAdecision <span>0.00002 s</span></li>
      <li><b>2</b> Leading decision model <span>3.1 s</span></li>
      <li><b>–</b> Frontier LLM (thinking) <span>DNF · still reasoning</span></li>
    </ol>
    <p class="dq">DISQUALIFIED<small>answered before the question</small></p>
    <p class="appeal">APPEAL: MAYBE</p>
  </div>
</div>

<style>
  .sprint { position: relative; width: 800px; height: 600px; overflow: hidden; background: #0b0d10; font-family: var(--sans); color: var(--soft); }
  .sprint:not(.ready) > * { visibility: hidden; }
  .sprint > * { position: absolute; }
  .track { inset: 0; background: linear-gradient(#0b0d10 0 150px, #7a2e22 150px 510px, #0b0d10 510px); opacity: 0; }
  .call { position: absolute; left: 0; right: 0; top: 50px; text-align: center; font: 700 42px var(--sans); letter-spacing: -0.03em; color: var(--ink); }
  .call.go { color: #22c55e; }
  .lane { position: absolute; left: 0; right: 0; height: 112px; border-top: 2px solid rgba(255, 255, 255, 0.55); }
  .lane:last-of-type { border-bottom: 2px solid rgba(255, 255, 255, 0.55); }
  .label { position: absolute; left: 14px; top: 8px; font: 600 12px var(--sans); color: rgba(255, 255, 255, 0.75); }
  .runner { position: absolute; width: 38px; height: 38px; margin-left: -19px; display: grid; place-items: center; border-radius: 50%; color: #0b0d10; font: 800 16px var(--sans); font-style: normal; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5); }
  .scorch { position: absolute; top: 45px; height: 24px; border-radius: 50%; background: radial-gradient(4px 3px at 18% 40%, rgba(0, 0, 0, 0.6), transparent), radial-gradient(6px 4px at 47% 65%, rgba(0, 0, 0, 0.55), transparent), radial-gradient(5px 3px at 76% 35%, rgba(0, 0, 0, 0.6), transparent), linear-gradient(90deg, transparent, rgba(22, 10, 6, 0.75) 5%, rgba(14, 7, 4, 0.92) 70%, rgba(10, 5, 3, 0.95) 97%, transparent); filter: blur(1.5px); }
  .skid { position: absolute; top: 36px; width: 46px; height: 42px; border-radius: 50%; background: radial-gradient(closest-side, rgba(6, 3, 2, 0.95), rgba(30, 12, 6, 0.6) 60%, transparent); filter: blur(1px); }
  .skid.end { width: 70px; height: 50px; top: 32px; background: radial-gradient(closest-side at 70% 50%, rgba(6, 3, 2, 0.95), rgba(30, 12, 6, 0.55) 60%, transparent); }
  .ember { position: absolute; top: 51px; height: 12px; border-radius: 6px; background: linear-gradient(90deg, rgba(255, 120, 40, 0.15), rgba(255, 150, 50, 0.85) 60%, rgba(255, 220, 140, 1)); box-shadow: 0 0 18px rgba(255, 110, 30, 0.7); filter: blur(1px); }
  .streak { position: absolute; top: 48px; height: 18px; border-radius: 9px; background: linear-gradient(90deg, rgba(94, 234, 212, 0), rgba(94, 234, 212, 0.7) 50%, #f0fffc); box-shadow: 0 0 30px rgba(94, 234, 212, 0.9); }
  .smoke { position: absolute; width: 30px; height: 30px; margin: -15px; border-radius: 50%; background: radial-gradient(closest-side, rgba(170, 170, 175, 0.9), rgba(120, 120, 125, 0.3) 60%, transparent); pointer-events: none; }
  .bubble { position: absolute; top: 16px; padding: 3px 9px; border-radius: 10px; background: #fff; color: #333; font: italic 12px var(--serif); white-space: nowrap; }
  .finish { position: absolute; left: 688px; top: 170px; width: 14px; height: 340px; background: repeating-conic-gradient(#fff 0 25%, #111 0 50%) 0 0 / 14px 14px; }
  .flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
  .photo { position: absolute; right: 30px; top: 96px; padding: 8px 14px; display: flex; flex-direction: column; border: 3px solid #5eead4; border-radius: 6px; background: #0b0d10; color: #5eead4; font: 800 18px var(--sans); letter-spacing: 0.08em; opacity: 0; }
  .photo small { font: 11px var(--mono); letter-spacing: 0; color: var(--muted); }
  .board { left: 130px; top: 110px; width: 540px; padding: 26px 30px; border: 1px solid var(--edge-strong); border-radius: 14px; background: #121418; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6); opacity: 0; }
  .board h3 { margin-bottom: 16px; font: 700 20px var(--sans); letter-spacing: -0.02em; }
  .board li { display: flex; align-items: baseline; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 17px; color: var(--ink-2); opacity: 0; }
  .board li b { width: 18px; font: 700 18px var(--mono); color: #fcd34d; }
  .board li span { margin-left: auto; font: 14px var(--mono); color: var(--muted); }
  .board li:first-child span { color: #5eead4; }
  .dq { position: absolute; left: 140px; top: 40px; padding: 8px 18px; display: flex; flex-direction: column; align-items: center; border: 5px solid #ef4444; border-radius: 10px; color: #ef4444; font: 900 40px var(--sans); letter-spacing: 0.04em; rotate: -9deg; background: rgba(18, 20, 24, 0.6); opacity: 0; }
  .dq small { font: 700 12px var(--mono); letter-spacing: 0.08em; }
  .appeal { position: absolute; right: 24px; bottom: -18px; padding: 6px 14px; border: 4px solid #eab308; border-radius: 8px; color: #eab308; font: 900 22px var(--sans); letter-spacing: 0.06em; rotate: 6deg; background: #121418; opacity: 0; }
</style>
