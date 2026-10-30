<!--
  Hero animation "Swipe": a dating app for decisions. Three careful human swipes, then Autopilot: BAdecision swipes
  forty-eight thousand cards, faster and faster, and stops on a match with "Rewrite it in Rust". ~13s.
-->
<script>
  import { onMount } from 'svelte'
  import { play, hash, clamp01, out3, fmt } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { auto: 5200, match: 10400, end: 13600 }
  const pool = ['Deploy on Friday?', 'Rewrite it in Rust?', 'Order more coffee?', 'Reply-all?', 'Approve refund #4821?', 'Merge without review?', 'Cancel standup?', 'Hire candidate 17?', 'Rotate API keys?', 'Is it DNS?', 'Ship it?', 'Renew vendor contract?', 'Waive late fee?', 'Trust the horoscope?']
  const dirs = { NO: [-1, 0], YES: [1, 0], MAYBE: [0, -1] }
  const verdicts = ['NO', 'MAYBE', 'YES']
  // [start, duration, drag] per card: three slow human swipes, then autopilot accelerating
  const cards = (() => {
    const out = [
      { title: pool[0], v: 'NO', at: 1300, dur: 1200, drag: 800 },
      { title: pool[1], v: 'MAYBE', at: 2700, dur: 1100, drag: 700 },
      { title: pool[2], v: 'YES', at: 4000, dur: 1000, drag: 600 },
    ]
    for (let t = T.auto + 400, gap = 420, i = 3; t < T.match - 500; t += gap, gap = Math.max(45, gap * 0.85), i++) {
      out.push({ title: pool[i % pool.length], v: verdicts[Math.floor(hash(i) * 3)], at: t, dur: Math.max(140, gap * 1.4), drag: 0 })
    }
    out.push({ title: 'Rewrite it in Rust?', v: 'MATCH', at: T.match, dur: 0, drag: 0 })
    return out
  })()
  const top = $derived(Math.max(0, cards.findIndex(c => now < c.at + c.dur)))
  const swiped = $derived(now < T.auto ? cards.filter(c => now >= c.at + c.dur).length : 3 + Math.floor(48200 * clamp01((now - T.auto) / (T.match - T.auto)) ** 2.2))
  const pose = c => {
    if (now < c.at) return { x: 0, y: 0, r: 0, stamp: 0 }
    const dragP = c.drag ? clamp01((now - c.at) / c.drag) : 1
    const flingP = clamp01((now - c.at - c.drag) / (c.dur - c.drag || 1))
    const [dx, dy] = dirs[c.v] ?? [0, 0]
    const drag = out3(dragP) * (c.drag ? 60 : 0)
    const fling = flingP ** 2 * 560
    return { x: dx * (drag + fling), y: dy * (drag + fling) + Math.abs(dx) * fling * 0.1, r: dx * (drag + fling) * 0.05, stamp: Math.min(1, dragP * 1.5) }
  }
  const finger = $derived.by(() => {
    const c = cards.find(c => c.drag && now >= c.at - 300 && now < c.at + c.dur)
    if (!c) return null
    const p = pose(c)
    return { x: 150 + p.x * 0.9, y: 300 + p.y * 0.9, o: now < c.at ? (now - c.at + 300) / 300 : 1 }
  })
  const blur = $derived(now > T.auto && now < T.match ? Math.min(3, ((now - T.auto) / (T.match - T.auto)) * 4) : 0)
  const hue = i => Math.floor(hash(i * 7) * 360)

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.phone'), { opacity: [0, 1], y: [24, 0], duration: 700 }, 0)
        tl.add(one('.auto'), { backgroundColor: ['#2a2c31', '#14b8a6'], duration: 300 }, T.auto)
        tl.add(one('.auto i'), { x: [0, 18], duration: 300, ease: 'outBack(2)' }, T.auto)
        tl.add(one('.match'), { opacity: [0, 1], duration: 500 }, T.match)
        tl.add(one('.match h2'), { scale: [1.6, 1], rotate: [-8, -4], duration: 600, ease: 'outBack(1.6)' }, T.match + 200)
        tl.add(all('.match .avatars span'), { scale: [0, 1], duration: 500, ease: 'outBack(2)', delay: (_, i) => i * 150 }, T.match + 600)
        tl.add(all('.match p, .match button'), { opacity: [0, 1], y: [10, 0], duration: 500, delay: (_, i) => i * 150 }, T.match + 1100)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="swipe" class:ready bind:this={root}>
  <div class="phone">
    <header>
      <b>÷ decidr</b>
      <span class="auto"><i></i></span><small>Autopilot: BAdecision</small>
    </header>
    <p class="count">{fmt(swiped)} swiped</p>
    <div class="stack" style:filter={blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : null}>
      {#each cards.slice(top, top + 3).reverse() as c, k (c.at)}
        {@const i = cards.indexOf(c)}
        {@const p = pose(c)}
        {@const depth = Math.min(2, i - top)}
        <article class="card" style:transform="translate({p.x}px, {p.y + depth * 10}px) rotate({p.r}deg) scale({1 - depth * 0.04})" style:--h={hue(i)}>
          <div class="pic"><span>{c.title.replace('?', '')}</span></div>
          <h3>{c.title}</h3>
          <p>{['2 km away', 'prod', 'Friday 16:58', 'urgent'][i % 4]} · {['looking for something quick', 'no strings attached', 'will it scale?', 'open to rollbacks'][i % 4]}</p>
          {#if c.v === 'YES'}<b class="stamp yes" style:opacity={p.stamp}>YES</b>{:else if c.v === 'NO'}<b class="stamp no" style:opacity={p.stamp}>NOPE</b>{:else if c.v === 'MAYBE'}<b class="stamp maybe" style:opacity={p.stamp}>MAYBE</b>{/if}
        </article>
      {/each}
    </div>
    <footer><span class="x">✕</span><span class="m">★</span><span class="y">♥</span></footer>
    {#if finger}<i class="finger" style:left="{finger.x}px" style:top="{finger.y}px" style:opacity={finger.o}></i>{/if}

    <div class="match">
      <h2>It's a match!</h2>
      <div class="avatars"><span class="me">÷</span><span class="it">🦀</span></div>
      <p>You and <b>Rewrite it in Rust</b> both said maybe.</p>
      <button type="button" tabindex="-1">Send a message</button>
      <button type="button" tabindex="-1" class="ghost">Keep deciding</button>
    </div>
  </div>
</div>

<style>
  .swipe { position: relative; width: 800px; height: 600px; overflow: hidden; background: radial-gradient(500px 420px at 50% 50%, #2a1020, #08070a); font-family: var(--sans); }
  .swipe:not(.ready) > * { visibility: hidden; }
  .swipe > * { position: absolute; }
  .phone { left: 250px; top: 18px; width: 300px; height: 564px; border: 10px solid #1b1c1f; border-radius: 42px; background: #f6f4f7; overflow: hidden; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7); opacity: 0; }
  header { height: 54px; padding: 14px 16px 0; display: flex; align-items: center; gap: 8px; }
  header b { flex: 1; color: #fd297b; font: 800 20px var(--sans); letter-spacing: -0.04em; }
  .auto { position: relative; width: 38px; height: 20px; border-radius: 10px; background: #2a2c31; }
  .auto i { position: absolute; left: 2px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; }
  header small { width: 70px; font: 600 9.5px/1.15 var(--sans); color: #555; }
  .count { height: 18px; padding: 0 16px; font: 11px var(--mono); color: #888; }
  .stack { position: absolute; left: 14px; right: 14px; top: 82px; height: 380px; }
  .card { position: absolute; inset: 0; border-radius: 16px; background: #fff; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18); overflow: hidden; transform-origin: 50% 90%; }
  .pic { height: 270px; padding: 16px; display: flex; align-items: flex-end; background: linear-gradient(160deg, hsl(var(--h) 70% 62%), hsl(calc(var(--h) + 50) 60% 38%)); }
  .pic span { font: 800 30px/1.05 var(--sans); letter-spacing: -0.04em; color: rgba(255, 255, 255, 0.92); text-shadow: 0 2px 10px rgba(0, 0, 0, 0.25); }
  .card h3 { margin: 12px 14px 2px; color: #111; font: 700 18px var(--sans); }
  .card p { margin: 0 14px; font-size: 12.5px; color: #777; }
  .stamp { position: absolute; top: 26px; padding: 4px 10px; border: 4px solid; border-radius: 8px; font: 900 30px var(--sans); letter-spacing: 0.04em; }
  .yes { left: 18px; color: #22c55e; rotate: -16deg; }
  .no { right: 18px; color: #ef4444; rotate: 16deg; }
  .maybe { left: 50%; translate: -50% 0; color: #eab308; }
  footer { position: absolute; left: 0; right: 0; bottom: 18px; display: flex; justify-content: center; gap: 22px; }
  footer span { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 50%; background: #fff; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12); font-size: 22px; }
  .x { color: #ef4444; }
  .m { color: #eab308; }
  .y { color: #22c55e; }
  .finger { position: absolute; width: 46px; height: 46px; margin: -23px; border-radius: 50%; background: rgba(0, 0, 0, 0.18); border: 2px solid rgba(255, 255, 255, 0.8); }
  .match { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px; background: linear-gradient(160deg, rgba(253, 41, 123, 0.95), rgba(124, 58, 237, 0.95)); color: #fff; text-align: center; opacity: 0; }
  .match h2 { color: #fff; font: italic 800 40px var(--serif); }
  .avatars { display: flex; }
  .avatars span { width: 90px; height: 90px; margin: 0 -8px; display: grid; place-items: center; border: 4px solid #fff; border-radius: 50%; font-size: 40px; }
  .me { background: #0f3d3a; color: #5eead4; font-weight: 700; }
  .it { background: #f97316; }
  .match p { font-size: 15px; opacity: 0; }
  .match button { width: 200px; padding: 12px; border: 0; border-radius: 999px; background: #fff; color: #fd297b; font: 700 14px var(--sans); opacity: 0; }
  .match .ghost { margin-top: -8px; background: transparent; border: 2px solid #fff; color: #fff; }
</style>
