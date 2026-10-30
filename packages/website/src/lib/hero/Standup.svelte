<!--
  Hero animation "Standup" (800×500): a video call. BAdecision connects first, the others trickle in. It answers the
  question before it is asked, with a NO that knocks the room back, and leaves. Everyone else stays for an hour and
  fifty minutes of "let's take this offline". ~16s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play } from './stage.js'
  import { testimonials } from '#lib/content.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const people = ['Priya Halvorsen', 'Tomás Okafor-Lindqvist', 'Dana Whitcombe', 'Marcus Teague', 'Ingrid Sato'].map(name => {
    const t = testimonials.find(x => x.name === name)
    return { name: name.split(' ')[0], avatar: t.avatar, initials: name.split(/[\s-]+/).slice(0, 2).map(w => w[0]).join('') }
  })
  // BAdecision connects first, then everyone else, one by one; each shows "Connecting" for a moment
  const J = { bot: 300, first: 1400, gap: 380, connect: 450 }
  const joinAt = i => J.first + i * J.gap
  // [time, speaker index (5 = BAdecision), line]
  const lines = [
    [3800, 0, 'So, one quick question before we start—'],
    [4300, 5, 'no.'],
    [5600, 0, "…I haven't asked it yet."],
    [6500, 1, "Let's take this offline."],
    [7100, 2, 'Can everyone see my screen?'],
    [7600, 3, "You're on mute."],
    [8100, 4, 'Sorry, I was on mute.'],
    [8600, 1, "Let's circle back on that."],
    [9100, 2, 'Quick sync after this?'],
    [9600, 3, 'Can we make this a recurring meeting?'],
    [11300, 0, 'Great meeting, everyone. Same time tomorrow?'],
  ]
  const T = { no: 4300, left: 10300, caption: 12400, end: 16100 }
  const current = $derived(lines.findLast(l => l[0] <= now))
  const speaking = $derived(current && now - current[0] < (current[1] === 5 ? 1400 : 900) ? current[1] : -1)
  const yelling = $derived(now >= T.no && now < T.no + 1500)
  const left = $derived(now >= T.left)
  const count = $derived((now >= J.bot ? 1 : 0) + people.filter((p, i) => now >= joinAt(i)).length - (left ? 1 : 0))
  // the call clock runs in real time until everyone is in, then in time-lapse, speeding up
  const seconds = $derived(Math.floor(now / 1000 + (Math.max(0, now - 3400) / 1000) ** 2.3 * 20))
  const clock = $derived(`${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`)

  const GLOW = { off: '0 0 0 1px rgba(94,234,212,0), 0 0 0px rgba(94,234,212,0)', rest: '0 0 0 1px rgba(94,234,212,0.45), 0 0 34px rgba(94,234,212,0.22)', peak: '0 0 0 3px rgba(94,234,212,1), 0 0 110px rgba(94,234,212,0.75)' }

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        const bot = one('.tile.bot')
        tl.add(bot, { opacity: [0, 1], scale: [0.9, 1], duration: 500, ease: 'outBack(1.4)' }, J.bot)
        tl.add(bot, { boxShadow: [GLOW.off, GLOW.rest], duration: 600 }, J.bot + J.connect)
        all('.tile.person').forEach((el, i) => tl.add(el, { opacity: [0, 1], scale: [0.92, 1], duration: 450 }, joinAt(i)))

        // the NO: the tile swells like it yelled, a shockwave rolls out and knocks the others back as it reaches them
        tl.add(bot, { boxShadow: [{ to: GLOW.peak, duration: 120 }, { to: GLOW.rest, duration: 1600, ease: 'outQuad' }] }, T.no)
        tl.add(bot, { scale: [{ to: 1.32, duration: 140, ease: 'outQuad' }, { to: 1.3, duration: 380 }, { to: 1, duration: 1100, ease: 'outElastic(1, .55)' }] }, T.no)
        tl.add(bot, { rotate: [{ to: -2.5, duration: 140 }, { to: 0, duration: 1000, ease: 'outElastic(1, .5)' }] }, T.no)
        tl.add(one('.yell'), { opacity: [0, 1], scale: [0.4, 1.15], duration: 160, ease: 'outQuad' }, T.no)
        tl.add(one('.yell'), { scale: 1, duration: 600, ease: 'outElastic(1, .5)' }, T.no + 160)
        tl.add(one('.yell'), { opacity: 0, scale: 0.9, duration: 400, ease: 'inQuad' }, T.no + 1100)
        const WAVE = { dur: 1300, reach: 80 * 9 } // ring radius 80px, scaled up to 9×
        tl.add(all('.wave'), { scale: [0.6, 9], opacity: { from: 0.9, to: 0, ease: 'inQuad' }, duration: WAVE.dur, ease: 'outQuad', delay: stagger(160) }, T.no)
        const mid = el => [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + el.offsetHeight / 2]
        const [bx, by] = mid(bot)
        all('.tile.person').forEach(el => {
          const [x, y] = mid(el)
          const d = Math.hypot(x - bx, y - by)
          const reached = (1 - Math.sqrt(1 - Math.min(1, (d - 90) / WAVE.reach))) * WAVE.dur // outQuad, solved for the near edge
          const push = 22 * (1 - d / 900)
          tl.add(
            el,
            {
              x: [{ to: ((x - bx) / d) * push, duration: 110, ease: 'outQuad' }, { to: 0, duration: 800, ease: 'outElastic(1, .45)' }],
              y: [{ to: ((y - by) / d) * push, duration: 110, ease: 'outQuad' }, { to: 0, duration: 800, ease: 'outElastic(1, .45)' }],
            },
            T.no + reached,
          )
        })
        tl.add(one('.cc'), { scale: [{ to: 1.14, duration: 120, ease: 'outQuad' }, { to: 1, duration: 700, ease: 'outElastic(1, .5)' }] }, T.no)

        tl.add(bot, { boxShadow: GLOW.off, duration: 400 }, T.left)
        tl.add(one('.call'), { opacity: 0.12, filter: ['blur(0px)', 'blur(3px)'], duration: 700 }, T.caption - 300)
        tl.add(one('.caption b'), { opacity: [0, 1], y: [12, 0], duration: 700 }, T.caption)
        tl.add(one('.caption small'), { opacity: [0, 1], duration: 700 }, T.caption + 900)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="standup" class:ready bind:this={root}>
  <div class="call">
    <header><b>● Daily standup</b><span>{clock}</span><small>{count} participant{count === 1 ? '' : 's'}</small></header>
    <div class="grid">
      <div class="tile bot" class:talk={speaking === 5} class:gone={left}>
        {#if left}
          <p class="leftmsg">BAdecision left the meeting</p>
        {:else}
          {#if now < J.bot + J.connect}<span class="conn">Connecting</span>{:else}<span class="av me" style:opacity={yelling ? 0 : 1}>÷</span>{/if}
          <b class="yell">NO</b>
          <p>BAdecision <i class="app">APP</i></p>
        {/if}
      </div>
      {#each people as p, i}
        <div class="tile person" class:talk={speaking === i}>
          {#if now < joinAt(i) + J.connect}<span class="conn">Connecting</span>{:else}<span class="av" style:background={p.avatar[0]} style:color={p.avatar[1]}>{p.initials}</span>{/if}
          <p>{p.name}{#if i === 3 || (i === 4 && now < 8100)}<i>🔇</i>{/if}</p>
        </div>
      {/each}
      {#each [0, 1, 2] as k (k)}<i class="wave"></i>{/each}
    </div>
    <p class="cc" class:bot={current?.[1] === 5}>{#if current}<b>{current[1] === 5 ? 'BAdecision' : people[current[1]].name}:</b> <span>{current[2]}</span>{/if}</p>
  </div>
  <p class="caption"><b>In and out in 20 µs.</b><small>BAdecision does not do standups. It does decisions.</small></p>
</div>

<style>
  .standup { position: relative; width: 800px; height: 500px; overflow: hidden; background: #111214; font-family: var(--sans); color: var(--soft); }
  .standup:not(.ready) > * { visibility: hidden; }
  .standup > * { position: absolute; }
  .call { inset: 0; }
  header { position: relative; z-index: 3; height: 44px; padding: 0 20px; display: flex; align-items: center; gap: 16px; background: #1a1b1e; font-size: 13px; }
  header b { color: #f87171; }
  header span { font: 500 15px var(--mono); color: var(--ink); font-variant-numeric: tabular-nums; }
  header small { margin-left: auto; color: var(--muted); font-variant-numeric: tabular-nums; }
  .grid { position: absolute; left: 20px; right: 20px; top: 60px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .tile { position: relative; height: 170px; display: grid; place-items: center; border-radius: 12px; background: #232428; outline: 3px solid transparent; transition: outline-color 0.15s; opacity: 0; }
  .tile.talk { outline-color: #22c55e; }
  .av { width: 74px; height: 74px; display: grid; place-items: center; border-radius: 50%; font: 700 24px var(--sans); animation: pop 0.4s cubic-bezier(0.2, 1.6, 0.4, 1); transition: opacity 0.15s; }
  @keyframes pop { from { scale: 0.5; opacity: 0; } }
  .conn { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
  .conn::before { content: ''; width: 14px; height: 14px; border: 2px solid #3a3d44; border-top-color: var(--soft); border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { rotate: 360deg; } }
  .me { background: #0f3d3a; color: #5eead4; font-size: 34px; }
  .tile p { position: absolute; left: 10px; bottom: 8px; padding: 2px 8px; border-radius: 6px; background: rgba(0, 0, 0, 0.55); font-size: 12px; color: #fff; }
  .tile p i { margin-left: 4px; font-style: normal; }
  .app { padding: 0 4px; border-radius: 3px; background: #2a2c31; font-size: 9px; }
  .bot { z-index: 2; background: radial-gradient(circle at 50% 45%, #10302c, #0b1f1d 70%); transform-origin: 15% 25%; }
  .bot.talk { outline-color: #5eead4; }
  .tile.bot p { color: #5eead4; font-weight: 600; }
  .bot .app { background: #0f3d3a; color: #5eead4; }
  .bot.gone { background: #18191b; }
  .yell { position: absolute; inset: 0; display: grid; place-items: center; font: 900 88px/1 var(--sans); letter-spacing: -0.06em; color: #5eead4; text-shadow: 0 0 30px rgba(94, 234, 212, 0.8); opacity: 0; pointer-events: none; }
  .tile p.leftmsg { position: static; background: none; color: var(--muted); font-size: 13px; font-weight: 400; }
  .wave { position: absolute; z-index: 1; left: calc((100% - 20px) / 6); top: 85px; width: 160px; height: 160px; margin: -80px; border: 2px solid #5eead4; border-radius: 50%; box-shadow: 0 0 18px rgba(94, 234, 212, 0.45), inset 0 0 18px rgba(94, 234, 212, 0.3); opacity: 0; pointer-events: none; }
  .cc { position: absolute; z-index: 3; left: 60px; right: 60px; bottom: 30px; min-height: 40px; padding: 10px 16px; border-radius: 8px; background: rgba(0, 0, 0, 0.75); font-size: 16px; color: #fff; text-align: center; }
  .cc b { color: #a8acb3; font-weight: 600; }
  .cc.bot b { color: #5eead4; }
  .cc.bot span { font: 800 24px/1 var(--sans); letter-spacing: -0.03em; color: #5eead4; text-shadow: 0 0 16px rgba(94, 234, 212, 0.6); }
  .caption { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
  .caption b { color: var(--ink); font: 800 52px var(--sans); letter-spacing: -0.045em; opacity: 0; }
  .caption small { font: italic 20px var(--serif); color: var(--soft); opacity: 0; }
  @media (prefers-reduced-motion: reduce) { .av, .conn::before { animation: none; } }
</style>
