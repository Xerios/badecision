<!--
  Hero animation "Coin": isItFalse() returns a real boolean; a maybe is settled by a coin weighted by the model. The coin
  goes up, comes down, and lands on its edge. ~11s.
-->
<script>
  import { onMount } from 'svelte'
  import { play, span, typeOut } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)
  let angle = $state(0)
  const coin = { a: 0 }

  const T = { type: 500, model: 2300, toss: 3300, land: 5000, wobble: 6600, result: 7000, caption: 8000, end: 11500 }
  const call = "isItFalse('Should I quit my job?')"
  const typed = $derived(typeOut(call, now, T.type, 45))
  const flight = $derived(span(now, T.toss, T.land - T.toss, p => p))
  const lift = $derived(Math.sin(Math.PI * flight) * 230)
  const faces = $derived(Math.abs(Math.cos((angle * Math.PI) / 180)))

  onMount(() =>
    play(
      root,
      (tl, { one }) => {
        tl.add(one('.code'), { opacity: [0, 1], y: [10, 0], duration: 500 }, 0)
        tl.add(one('.model'), { opacity: [0, 1], x: [-8, 0], duration: 500 }, T.model)
        tl.add(one('.table'), { opacity: [0, 1], duration: 600 }, T.model + 300)
        tl.add(coin, { a: [{ to: 6 * 360 + 90, duration: T.land - T.toss, ease: 'outQuad' }, { to: 6 * 360 + 74, duration: 260, ease: 'inOutSine' }, { to: 6 * 360 + 102, duration: 300, ease: 'inOutSine' }, { to: 6 * 360 + 82, duration: 300, ease: 'inOutSine' }, { to: 6 * 360 + 95, duration: 300, ease: 'inOutSine' }, { to: 6 * 360 + 90, duration: 400, ease: 'outQuad' }] }, T.toss)
        tl.add(one('.result'), { opacity: [0, 1], x: [-8, 0], duration: 500 }, T.result)
        tl.add(one('.caption'), { opacity: [0, 1], y: [12, 0], duration: 800 }, T.caption)
        tl.add(one('.caption small'), { opacity: [0, 1], duration: 700 }, T.caption + 800)
        return T.end
      },
      { still, onend, onUpdate: t => ((now = t), (angle = coin.a)), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="coin-v" class:ready bind:this={root}>
  <div class="code">
    <p><span>›</span> {typed}</p>
    <p class="model">model says <b>maybe</b> <small>(0.50)</small> · settling with a coin weighted by the model…</p>
    <p class="result">→ <b>¯\_(ツ)_/¯</b></p>
  </div>
  <div class="table">
    <i class="shadow" style:transform="scaleX({1 - lift / 400})" style:opacity={0.6 - lift / 600}></i>
    <div class="scene" style:transform="translateY({-lift}px)">
      <div class="coin" style:transform="rotateX({angle}deg)">
        <span class="face front">true</span>
        <span class="face back">false</span>
      </div>
      <i class="rim" style:opacity={1 - Math.min(1, faces * 5)}></i>
    </div>
  </div>
  <p class="caption">isItFalse(): a real boolean.*<small>*the coin may land on its edge. The model weighs that too.</small></p>
</div>

<style>
  .coin-v { position: relative; width: 800px; height: 600px; overflow: hidden; background: radial-gradient(500px 380px at 50% 70%, #1a1712, #07070a); color: var(--soft); font-family: var(--sans); }
  .coin-v:not(.ready) > * { visibility: hidden; }
  .coin-v > * { position: absolute; }
  .code { left: 70px; top: 50px; right: 70px; display: flex; flex-direction: column; gap: 10px; font: 19px var(--mono); color: var(--ink-2); opacity: 0; }
  .code span { color: var(--muted); }
  .model { font-size: 13.5px; color: var(--muted); opacity: 0; }
  .model b { color: #fcd34d; font-weight: 500; }
  .result { font-size: 26px; opacity: 0; }
  .result b { color: #fcd34d; font-weight: 500; }
  .table { left: 0; right: 0; top: 260px; height: 260px; opacity: 0; }
  .table::before { content: ''; position: absolute; left: 120px; right: 120px; top: 222px; height: 1px; background: linear-gradient(90deg, transparent, #3a3326, transparent); }
  .shadow { position: absolute; left: 330px; top: 214px; width: 140px; height: 16px; border-radius: 50%; background: #000; filter: blur(5px); }
  .scene { position: absolute; left: 330px; top: 80px; width: 140px; height: 140px; perspective: 700px; }
  .coin { position: absolute; inset: 0; transform-style: preserve-3d; }
  .face { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 50%; backface-visibility: hidden; font: 700 26px var(--mono); letter-spacing: -0.02em; box-shadow: inset 0 0 0 6px rgba(0, 0, 0, 0.18), inset 0 0 0 9px rgba(255, 255, 255, 0.25); }
  .front { background: radial-gradient(circle at 35% 30%, #fff1b8, #e0b543 55%, #a87b17); color: #5b4106; }
  .back { transform: rotateX(180deg); background: radial-gradient(circle at 35% 30%, #f3f3f3, #b8bcc4 55%, #7b808a); color: #33363d; }
  .rim { position: absolute; left: 0; top: 63px; width: 140px; height: 14px; border-radius: 4px; background: repeating-linear-gradient(90deg, #c9a03a 0 3px, #a07a1c 3px 6px); }
  .caption { left: 0; right: 0; top: 520px; display: flex; flex-direction: column; align-items: center; gap: 6px; font: 600 28px var(--sans); letter-spacing: -0.03em; color: var(--ink); opacity: 0; }
  .caption small { font: 13px var(--mono); letter-spacing: 0; color: var(--muted); opacity: 0; }
</style>
