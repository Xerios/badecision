<!--
  Hero animation "Opposite Day": isItTrue('Is today Opposite Day?') says 'true', which on Opposite Day means false,
  which means true. The card flips with every reading, faster and faster, and stops upside down. ~13.5s.
-->
<script>
  import { onMount } from 'svelte'
  import { play, span, typeOut } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)
  let deg = $state(0)
  let blur = $state(0)
  const spin = { deg: 0 }

  const SPIN = 4400 + 4580 // start of the long spin, from the keyframes below
  const T = { type: 700, answer: 2700, banner: 3600, flip: 4400, spin: 8600, rest: 10600, caption: 11000, end: 13800 }
  const question = "isItTrue('Is today Opposite Day?')"
  const typed = $derived(typeOut(question, now, T.type, 50))
  const upright = $derived(Math.floor(((((deg % 360) + 360) % 360) + 90) / 180) % 2 === 0)
  const flips = $derived(Math.floor((deg + 90) / 180))
  const lines = ["…so it's false.", '…which means it’s true.', "…so it's false?", '…true??', 'false', 'true', 'f', 't']
  const thought = $derived(now >= T.flip + 700 && now < T.spin ? lines[Math.min(lines.length - 1, flips - 1)] : '')

  onMount(() =>
    play(
      root,
      (tl, { one }) => {
        tl.add(one('.card'), { opacity: [0, 1], y: [16, 0], duration: 600 }, 0)
        tl.add(one('.answer'), { opacity: [0, 1], x: [-8, 0], duration: 400 }, T.answer)
        tl.add(one('.banner'), { opacity: [0, 1], y: [-14, 0], rotate: [-8, -3], duration: 500, ease: 'outBack(1.8)' }, T.banner)
        tl.add(
          spin,
          {
            deg: [
              { to: 180, duration: 900, ease: 'outBack(1.3)' },
              { to: 180, duration: 1200 },
              { to: 360, duration: 700, ease: 'outBack(1.2)' },
              { to: 360, duration: 500 },
              { to: 540, duration: 450, ease: 'outQuad' },
              { to: 540, duration: 250 },
              { to: 720, duration: 320, ease: 'outQuad' },
              { to: 900, duration: 260, ease: 'outQuad' },
              { to: 2700, duration: 2000, ease: 'inOutSine' },
            ],
          },
          T.flip,
        )
        tl.add(one('.final'), { opacity: [0, 1], y: [12, 0], duration: 800 }, T.caption)
        tl.add(one('.final small'), { opacity: [0, 1], duration: 700 }, T.caption + 900)
        return T.end
      },
      {
        still,
        onend,
        onUpdate: t => {
          now = t
          deg = spin.deg
          // motion blur through the fast spin only
          const p = (t - SPIN) / 2000
          blur = p > 0 && p < 1 ? 5 * Math.sin(Math.PI * p) : 0
        },
        onReady: () => (ready = true),
      },
    ),
  )
</script>

<div class="opposite" class:ready bind:this={root}>
  <div class="card" style:rotate="{deg}deg" style:filter={blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : null}>
    <p class="banner">📅 Today: Opposite Day <small>(mandatory)</small></p>
    <p class="code">
      <span>›</span>
      {typed}{#if now < T.answer}<i class:on={Math.floor(now / 450) % 2 === 0}></i>{/if}
    </p>
    <p class="answer">
      → {#if upright}<b class="t">'true'</b>{:else}<b class="f">false</b>{/if}
    </p>
  </div>
  <p class="thought">{thought}</p>
  <p class="final">Opposite Day support: <b>mandatory.</b><small>isItTrue() consults the model and the stars. Then disagrees with itself.</small></p>
</div>

<style>
  .opposite {
    position: relative;
    width: 800px;
    height: 600px;
    overflow: hidden;
    background: radial-gradient(500px 360px at 50% 45%, #121417, #07080a);
    color: var(--soft);
    font-family: var(--sans);
  }
  .opposite:not(.ready) > * {
    visibility: hidden;
  }
  .opposite > * {
    position: absolute;
  }
  .card {
    left: 140px;
    top: 190px;
    width: 520px;
    height: 200px;
    padding: 48px 34px 0;
    border: 1px solid var(--edge-strong);
    border-radius: 18px;
    background: var(--panel);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
    opacity: 0;
    overflow: visible;
  }
  .banner {
    position: absolute;
    left: 24px;
    top: -18px;
    padding: 7px 14px;
    border-radius: 8px;
    background: #fcd34d;
    color: #1a1300;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    opacity: 0;
  }
  .banner small {
    font-weight: 400;
    opacity: 0.7;
  }
  .code {
    font: 20px var(--mono);
    color: var(--ink-2);
    white-space: pre;
  }
  .code span {
    color: var(--muted);
  }
  .code i {
    display: inline-block;
    width: 10px;
    height: 22px;
    vertical-align: -4px;
  }
  .code i.on {
    background: var(--ink);
  }
  .answer {
    margin-top: 22px;
    font: 40px var(--mono);
    color: var(--muted);
    opacity: 0;
  }
  .t {
    color: #8ee6ae;
    font-weight: 500;
  }
  .f {
    color: #ffa198;
    font-weight: 500;
  }
  .thought {
    left: 0;
    right: 0;
    top: 440px;
    text-align: center;
    font: italic 26px var(--serif);
    color: var(--soft);
  }
  .final {
    left: 0;
    right: 0;
    top: 448px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    font: 600 34px var(--sans);
    letter-spacing: -0.03em;
    color: var(--ink);
    opacity: 0;
  }
  .final b {
    color: #fcd34d;
  }
  .final small {
    font: 13.5px var(--mono);
    letter-spacing: 0;
    color: var(--muted);
    opacity: 0;
  }
</style>
