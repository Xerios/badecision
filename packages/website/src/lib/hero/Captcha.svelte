<!--
  Hero animation "Captcha": "Select all squares with good decisions". A human hovers, hesitates and takes forty
  (time-lapsed) seconds; BAdecision decides all nine in 20 µs, presses Verify, and is rejected for being too fast. ~12s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, hash, clamp01, io3 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { human: 600, takeover: 5900, decide: 6400, verify: 7100, reject: 7500, caption: 8600, end: 12000 }
  const tiles = [
    ['Deploy on Friday', 'NO'], ['Rewrite it in Rust', 'MAYBE'], ['Reply-all', 'NO'],
    ['Approve refund #4821', 'MAYBE'], ['Merge without review', 'NO'], ['Order more coffee', 'YES'],
    ['Cancel standup', 'YES'], ['Trust the horoscope', 'YES'], ['Hire candidate 17', 'NOT SURE'],
  ]
  const color = { YES: '#2ea043', NO: '#d73a49', MAYBE: '#d29922', 'NOT SURE': '#6e7681' }
  const centre = i => [94 + 54 + (i % 3) * 112, 178 + 54 + Math.floor(i / 3) * 112]
  // the human's cursor: [time, x, y]
  const path = [[600, 560, 560], [2000, ...centre(5)], [2500, ...centre(5)], [3100, ...centre(0)], [3500, centre(1)[0] - 20, centre(1)[1]], [3900, ...centre(0)], [4300, centre(1)[0] - 10, centre(1)[1] + 10], [4700, ...centre(0)], [5300, ...centre(2)], [5900, ...centre(2)], [6700, 620, 640]]
  const cursor = $derived.by(() => {
    let k = path.findIndex(p => p[0] > now)
    if (k === -1) return path.at(-1).slice(1)
    if (k === 0) return path[0].slice(1)
    const [t0, x0, y0] = path[k - 1]
    const [t1, x1, y1] = path[k]
    const p = io3(clamp01((now - t0) / (t1 - t0)))
    return [x0 + (x1 - x0) * p, y0 + (y1 - y0) * p]
  })
  const clicked = $derived(now >= 2200)
  const decided = $derived(now >= T.decide)
  const selected = i => (decided ? tiles[i][1] === 'YES' : i === 5 && clicked)
  const human = $derived(Math.min(41, Math.floor(Math.max(0, Math.min(now, T.takeover) - T.human) / 1000 * 8)))

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.widget'), { opacity: [0, 1], y: [14, 0], duration: 600 }, 0)
        tl.add(one('.timers'), { opacity: [0, 1], duration: 600 }, T.human)
        tl.add(one('.press'), { scale: [{ to: 0.8, duration: 80 }, { to: 1, duration: 200 }], opacity: [0, 0.5, 0], duration: 300 }, 2200)
        tl.add(one('.bot'), { opacity: [0, 1], x: [-10, 0], duration: 400 }, T.takeover)
        tl.add(all('.stamp'), { opacity: [0, 1], scale: [2, 1], duration: 160, ease: 'outQuad', delay: stagger(12) }, T.decide)
        tl.add(one('.widget'), { x: [{ to: -3, duration: 30 }, { to: 3, duration: 30 }, { to: 0, duration: 40 }] }, T.decide + 120)
        tl.add(one('.verify'), { backgroundColor: ['#1a73e8', '#0b4fb3', '#1a73e8'], scale: [0.94, 1], duration: 250 }, T.verify)
        tl.add(one('.reject'), { opacity: [0, 1], duration: 300 }, T.reject)
        tl.add(one('.reject p'), { scale: [0.8, 1], duration: 500, ease: 'outBack(1.8)' }, T.reject)
        tl.add(one('.widget'), { x: [{ to: -8, duration: 50 }, { to: 7, duration: 50 }, { to: -5, duration: 50 }, { to: 3, duration: 50 }, { to: 0, duration: 60 }] }, T.reject + 100)
        tl.add(one('.caption'), { opacity: [0, 1], y: [14, 0], duration: 800 }, T.caption)
        tl.add(one('.caption small'), { opacity: [0, 1], duration: 700 }, T.caption + 700)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="captcha" class:ready bind:this={root}>
  <div class="widget">
    <header><span>Select all squares with</span><b>good decisions</b><span>If there are none, click skip</span></header>
    <div class="grid">
      {#each tiles as [label, verdict], i}
        <div class="tile" class:sel={selected(i)} style:--h={Math.floor(hash(i * 5) * 360)}>
          <span>{label}</span>
          <b class="stamp" style:background={color[verdict]}>{verdict}</b>
          {#if selected(i)}<i>✓</i>{/if}
        </div>
      {/each}
    </div>
    <footer><span>↻</span><span>🎧</span><span>ⓘ</span><button class="verify" type="button" tabindex="-1">VERIFY</button></footer>
    <div class="reject"><p><b>✕</b> Too fast.<small>Humans take at least 3 seconds to find the coffee.</small></p></div>
  </div>

  <div class="timers">
    <p>Human <b>00:{String(human).padStart(2, '0')}</b><small>time-lapse ×8</small></p>
    <p class="bot">BAdecision <b>0.00002 s</b></p>
  </div>
  <div class="caption">Too fast to be human.<small>~20 µs per decision. Captchas hate this.</small></div>

  {#if now < 6700}
    <span class="press" style:left="{cursor[0] - 14}px" style:top="{cursor[1] - 14}px"></span>
    <svg class="cursor" width="22" height="26" viewBox="0 0 26 30" style:transform="translate({cursor[0]}px, {cursor[1]}px)">
      <path d="M2 2 L2 24 L8 18 L12 27 L16 25 L12 17 L20 17 Z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round" />
    </svg>
  {/if}
</div>

<style>
  .captcha { position: relative; width: 800px; height: 600px; overflow: hidden; background: #0d0e10; font-family: var(--sans); color: var(--soft); }
  .captcha:not(.ready) > * { visibility: hidden; }
  .captcha > * { position: absolute; }
  .widget { left: 80px; top: 60px; width: 360px; height: 514px; border: 1px solid #d0d7de; border-radius: 3px; background: #fff; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6); overflow: hidden; opacity: 0; }
  header { height: 110px; margin: 8px 8px 0; padding: 16px 18px; display: flex; flex-direction: column; gap: 2px; background: #1a73e8; color: #fff; font-size: 14px; }
  header b { font-size: 26px; line-height: 1.1; }
  header span:last-child { margin-top: 6px; font-size: 13px; opacity: 0.9; }
  .grid { margin: 0 6px; padding: 8px; display: grid; grid-template-columns: repeat(3, 108px); gap: 4px; }
  .tile { position: relative; height: 108px; padding: 8px; display: flex; align-items: flex-end; background: linear-gradient(160deg, hsl(var(--h) 30% 38%), hsl(calc(var(--h) + 40) 25% 18%)); color: #fff; font-size: 12.5px; font-weight: 600; line-height: 1.2; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7); transition: transform 0.12s; }
  .tile.sel { transform: scale(0.84); }
  .tile i { position: absolute; left: -6px; top: -6px; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; background: #1a73e8; color: #fff; font-style: normal; font-size: 14px; }
  .stamp { position: absolute; right: 6px; top: 6px; padding: 2px 6px; border-radius: 4px; color: #fff; font: 700 11px var(--mono); text-shadow: none; opacity: 0; }
  footer { height: 56px; margin-top: 2px; padding: 0 14px; display: flex; align-items: center; gap: 14px; border-top: 1px solid #e1e4e8; color: #5f6368; font-size: 17px; }
  .verify { margin-left: auto; padding: 10px 22px; border: 0; border-radius: 3px; background: #1a73e8; color: #fff; font: 600 14px var(--sans); }
  .reject { position: absolute; inset: 126px 0 58px; display: grid; place-items: center; background: rgba(255, 255, 255, 0.94); opacity: 0; }
  .reject p { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 30px; text-align: center; color: #d73a49; font-size: 30px; font-weight: 700; }
  .reject p b { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 50%; background: #d73a49; color: #fff; font-size: 26px; }
  .reject small { font-size: 14px; font-weight: 500; color: #57606a; }

  .timers { left: 480px; top: 120px; display: flex; flex-direction: column; gap: 12px; opacity: 0; }
  .timers p { display: flex; align-items: baseline; gap: 12px; font-size: 18px; color: var(--muted); }
  .timers b { font: 500 30px var(--mono); color: var(--ink); }
  .timers small { font: 11px var(--mono); color: #4b4f57; }
  .timers .bot { opacity: 0; }
  .timers .bot b { color: #5eead4; }
  .caption { left: 480px; top: 330px; width: 290px; display: flex; flex-direction: column; gap: 12px; font: 600 38px/1.1 var(--sans); letter-spacing: -0.04em; color: var(--ink); opacity: 0; }
  .caption small { font: 14px/1.5 var(--sans); letter-spacing: 0; color: var(--muted); opacity: 0; }
  .press { width: 28px; height: 28px; border-radius: 50%; background: #1a73e8; opacity: 0; }
  .cursor { left: 0; top: 0; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6)); }
</style>
