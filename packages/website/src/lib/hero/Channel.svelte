<!--
  Hero animation "Channel": a team chat where everyone asks the bot. A refund, a retro, then BAdecision answers Dana
  before she has finished asking ("no laws, no limits, very fast, yeh"). Marcus asks whether to wipe the old backups.
  Prod starts formatting, the channels light up, the bot says yes faster and faster while the chat slowly fades away;
  "Not a meatproxy, but a meatbuddy."; the name. ~35s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger, createDrawable } from 'animejs'
  import { play, hash, clamp01, span } from './stage.js'
  import { testimonials } from '#lib/content.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)
  let view = $state(0)
  let heights = $state.raw([])

  const T = { dim: 11800, said: 12400, undim: 16700, format: 20300, chaos: 21300, spam: 22500, fade: 23600, quote: 27200, buddy: 28300, settle: 31400, end: 35000 }

  const who = name => testimonials.find(t => t.name === name)
  const P = (name, at, text, typing = 0) => {
    const t = who(name)
    return { name, role: t.role, avatar: t.avatar, initials: name.split(/[\s-]+/).slice(0, 2).map(w => w[0]).join(''), at, text, typing }
  }
  const bot = { name: 'BAdecision', bot: true, initials: '÷', avatar: ['#0f3d3a', '#5eead4'] }
  const B = (at, verdict, meta) => ({ ...bot, at, verdict, meta })
  const SYS = (at, text) => ({ system: true, at, text })
  // the bot's answers once it is asked to stop: yes, more and more of the time, faster and faster
  const spam = (() => {
    const out = []
    for (let t = T.spam, gap = 420, i = 0; t < T.quote - 600; t += gap, gap = Math.max(70, gap * 0.87), i++) {
      const p = clamp01((t - T.spam) / (T.quote - 900 - T.spam))
      const r = hash(i * 13 + 5)
      out.push({ ...bot, at: t, spam: r < 0.35 + 0.65 * p ? 'yes' : r < 0.85 ? 'maybe' : 'no' })
    }
    return out
  })()

  const messages = [
    P('Priya Halvorsen', 900, '@BAdecision should we approve refund #4821? Finance needs it by EOD.', 700),
    B(1350, 'MAYBE', '0.33 · answered in 0.02 ms'),
    P('Priya Halvorsen', 2900, "maybe. ok. I'll tell finance maybe.", 800),
    P('Tomás Okafor-Lindqvist', 4500, '@BAdecision is the retro worth having this sprint?', 900),
    B(4950, 'NO', '0.71 · answered in 0.02 ms'),
    P('Tomás Okafor-Lindqvist', 6100, 'cancelled. thank you, robot.', 700),
    B(7900, 'NO', '0.91 · answered in −1.1 s'),
    P('Dana Whitcombe', 9000, '@BAdecision should we deploy on Friday?', 1700),
    P('Dana Whitcombe', 10600, 'wait. how did it reply before I even asked??', 1000),
    P('Marcus Teague', 17800, "@BAdecision disks are full on the db hosts. ok to wipe the old backups?", 900),
    B(18250, 'YES', '0.97 · answered in 0.02 ms'),
    P('Marcus Teague', 19300, 'running it', 600),
    SYS(T.format, 'Could not back up prod-01: server format in progress'),
    SYS(T.format + 300, 'Could not back up prod-02: server format in progress'),
    SYS(T.format + 550, 'Could not back up prod-03: server format in progress'),
    P('Marcus Teague', T.chaos, 'wait'),
    P('Marcus Teague', T.chaos + 200, 'WAIT'),
    P('Priya Halvorsen', T.chaos + 500, 'who is formatting prod??'),
    P('Dana Whitcombe', T.chaos + 800, 'rollback rollback rollback'),
    P('Tomás Okafor-Lindqvist', T.chaos + 1050, '@BAdecision should we panic?'),
    P('Ingrid Sato', T.chaos + 1650, 'is this covered by the license'),
    SYS(T.chaos + 1900, 'Could not back up prod-04: server format in progress'),
    P('Marcus Teague', T.chaos + 2200, '@BAdecision STOP'),
    P('Priya Halvorsen', T.chaos + 2800, '@BAdecision are you doing this??'),
    SYS(T.chaos + 3100, 'Could not back up prod-05: server format in progress'),
    P('Dana Whitcombe', T.chaos + 3400, 'whose idea was "wipe the old backups"'),
    ...spam,
  ]
    .sort((a, b) => a.at - b.at)
    .map((m, i, list) => ({ ...m, compact: i > 0 && !m.system && !list[i - 1].system && list[i - 1].name === m.name }))

  const verdictColor = { YES: '#8ee6ae', NO: '#ffa198', MAYBE: '#fcd34d', yes: '#8ee6ae', no: '#ffa198', maybe: '#fcd34d' }
  const mention = text => text.split(/(@BAdecision)/)
  const minute = m => `4:${String(12 + Math.min(14, Math.floor(m.at / 1600))).padStart(2, '0')} PM`

  // the list scrolls up by each message's height as it arrives
  const arrive = i => span(now, messages[i].at, 380)
  const scrolled = $derived(heights.reduce((a, h, i) => a + h * arrive(i), 0))
  const typing = $derived(messages.filter(m => m.typing && now >= m.at - m.typing && now < m.at))
  const dots = $derived('.'.repeat(1 + (Math.floor(now / 300) % 3)))

  // mayhem: the other channels and the unread bar
  const channels = [['general', T.chaos + 300, 90], ['incidents', T.format + 200, 35], ['deploys-friday', T.chaos + 900, 120], ['legal', T.chaos + 1700, 150], ['random', T.chaos + 2400, 200]]
  const unread = (start, rate) => (now < start ? 0 : Math.floor(((now - start) / rate) ** 1.2) + 1)
  const fresh = $derived(now < T.chaos ? 0 : Math.floor(((now - T.chaos) / 22) ** 1.1) + 3)
  const said = ['no', 'laws,', 'no', 'limits,', 'very', 'fast,', 'yeh']
  const sparks = [['-46px', '-4px'], ['-26px', '36px'], ['calc(100% + 12px)', '-8px'], ['calc(100% + 30px)', '32px']]

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        view = one('.messages').clientHeight
        heights = all('.msg').map(el => el.offsetHeight)
        const app = one('.app')
        tl.add(app, { opacity: [0, 1], scale: [0.97, 1], duration: 600 }, 0)
        all('.card').forEach(el => tl.add(el, { scale: [0.85, 1], duration: 600, ease: 'outBack(1.8)' }, +el.dataset.at + 60))

        // "how did it reply before I even asked": the room goes dark, the bot explains itself
        tl.add(app, { opacity: 0.1, filter: ['blur(0px)', 'blur(2px)'], duration: 800, ease: 'inOutSine' }, T.dim)
        tl.add(all('.said span'), { opacity: [0, 1], y: [10, 0], filter: ['blur(6px)', 'blur(0px)'], duration: 380, ease: 'outCubic', delay: stagger(400) }, T.said)
        tl.add(one('.said small'), { opacity: [0, 1], duration: 600 }, T.said + 3000)
        tl.add(one('.said'), { opacity: 0, y: -12, duration: 600, ease: 'inQuad' }, T.undim - 300)
        tl.add(app, { opacity: 1, filter: 'blur(0px)', duration: 800, ease: 'inOutSine' }, T.undim)

        // mayhem in the foreground; the chat drifts away slowly, the quote takes its place
        tl.add(one('.newbar'), { opacity: [0, 1], y: [-30, 0], duration: 400, ease: 'outBack(1.4)' }, T.chaos + 100)
        tl.add(app, { opacity: 0, scale: 0.965, filter: ['blur(0px)', 'blur(3px)'], duration: 3800, ease: 'inOutSine' }, T.fade)
        tl.add(one('.q1'), { opacity: [0, 1], y: [16, 0], duration: 900 }, T.quote)
        tl.add(one('.q2'), { opacity: [0, 1], y: [16, 0], duration: 900 }, T.buddy)
        tl.add(one('.proxy'), { opacity: 0.5, duration: 700, ease: 'inOutSine' }, T.buddy + 300)
        tl.add(createDrawable(one('.underline'), 0, 0), { draw: '0 1', duration: 650, ease: 'inOutCubic' }, T.buddy + 600)
        tl.add(all('.spark'), { opacity: [0, 1], scale: [0, 1.25, 1], rotate: [-40, 0], duration: 600, ease: 'outBack(2)', delay: stagger(130, { from: 'random' }) }, T.buddy + 1100)
        // the quote becomes the tagline under the name
        tl.add(one('.quote'), { y: 64, scale: 0.46, duration: 1100, ease: 'inOutCubic' }, T.settle)
        tl.add(one('.name h2'), { opacity: [0, 1], y: [18, 0], duration: 900 }, T.settle + 500)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="channel" class:ready bind:this={root}>
  <div class="app">
    <aside>
      <b>Acme Corp</b>
      <h5>Channels</h5>
      <ul>
        <li class="on"># decisions</li>
        {#each channels as [name, start, rate]}
          {@const n = unread(start, rate)}
          <li class:hot={n > 0}># {name}{#if n > 0}<mark>{n > 99 ? '99+' : n}</mark>{/if}</li>
        {/each}
      </ul>
      <h5>Apps</h5>
      <ul><li><i>÷</i> BAdecision</li></ul>
    </aside>
    <main>
      <header><b># decisions</b><span>Every decision, decided. · 1,204 members</span></header>
      <div class="messages">
        <p class="newbar">↑ {fresh} new messages in #incidents <b>Jump</b></p>
        <div class="list" style:transform="translateY({view - scrolled - 8}px)">
          {#each messages as m, i}
            {@const p = arrive(i)}
            <article class="msg" class:compact={m.compact} class:system={m.system} style:opacity={p} style:transform="translateY({(1 - p) * 14}px)">
              {#if m.system}
                <span class="icon">!</span><p>{m.text}</p>
              {:else}
                {#if m.compact}<span class="gutter"></span>{:else}<span class="avatar" style:background={m.avatar[0]} style:color={m.avatar[1]}>{m.initials}</span>{/if}
                <div>
                  {#if !m.compact}<p class="who"><b>{m.name}</b>{#if m.bot}<em>APP</em>{/if}<span>{m.role ?? ''}</span><time>{minute(m)}</time></p>{/if}
                  {#if m.verdict}
                    <p class="card" data-at={m.at} style:border-left-color={verdictColor[m.verdict]}><span class="verdict" style:color={verdictColor[m.verdict]}>{m.verdict}</span><small>{m.meta}</small></p>
                  {:else if m.spam}
                    <p class="text spam" style:color={verdictColor[m.spam]}>{m.spam}</p>
                  {:else}
                    <p class="text">{#each mention(m.text) as part}{#if part === '@BAdecision'}<span class="mention">{part}</span>{:else}{part}{/if}{/each}</p>
                  {/if}
                </div>
              {/if}
            </article>
          {/each}
        </div>
      </div>
      <footer>
        <div class="composer">Message #decisions</div>
        <p class="typing">{#if typing.length > 1}Several people are typing{dots}{:else if typing.length}<b>{typing[0].name}</b> is typing{dots}{/if}</p>
      </footer>
    </main>
  </div>

  <p class="said">{#each said as w}<span class:yeh={w === 'yeh'}>{w}</span>{/each}<small>BAdecision, on latency</small></p>

  <blockquote class="quote">
    <p class="q1">Not a <span class="proxy">meatproxy</span>,</p>
    <p class="q2">
      but a <span class="buddy"><span>meatbuddy</span><svg viewBox="0 0 240 16" preserveAspectRatio="none"><path class="underline" d="M3 10 C 50 3, 90 15, 130 8 S 205 4, 237 9" /></svg></span>.{#each sparks as [x, y]}<i class="spark" style:left={x} style:top={y}>✨</i>{/each}
    </p>
  </blockquote>
  <div class="name"><h2>BAdecision</h2></div>
</div>

<style>
  .channel { position: relative; width: 800px; height: 600px; overflow: hidden; background: #08090a; color: var(--soft); font-family: var(--sans); }
  .channel:not(.ready) > * { visibility: hidden; }
  .channel > * { position: absolute; }
  .app { inset: 18px; display: flex; border: 1px solid var(--edge-strong); border-radius: 12px; overflow: hidden; background: #0f1011; opacity: 0; }

  aside { width: 172px; flex: none; padding: 14px 10px; border-right: 1px solid var(--line); background: #0b0c0d; font-size: 13px; }
  aside > b { display: block; padding: 0 8px 12px; color: var(--ink); font-size: 15px; }
  aside h5 { margin: 12px 8px 4px; font: 500 11px var(--sans); color: var(--muted); }
  aside li { padding: 4px 8px; border-radius: 6px; color: var(--text); }
  aside li { display: flex; align-items: center; }
  aside li.on { background: rgba(94, 234, 212, 0.12); color: var(--ink); }
  aside li.hot { color: var(--ink); font-weight: 600; }
  aside mark { margin-left: auto; padding: 0 6px; border-radius: 999px; background: #e5484d; color: #fff; font: 600 10.5px/17px var(--sans); }
  aside li i { display: inline-grid; place-items: center; width: 16px; height: 16px; margin-right: 4px; border-radius: 4px; background: #0f3d3a; color: #5eead4; font-style: normal; font-size: 11px; }

  main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  main header { height: 48px; flex: none; padding: 0 18px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--line); }
  main header b { color: var(--ink); font-size: 15px; }
  main header span { font-size: 12.5px; color: var(--muted); }
  .messages { position: relative; flex: 1; overflow: hidden; }
  .newbar { position: absolute; z-index: 1; left: 50%; top: 10px; margin-left: -150px; width: 300px; padding: 6px 14px; display: flex; justify-content: space-between; border-radius: 999px; background: #e5484d; color: #fff; font-size: 12.5px; font-variant-numeric: tabular-nums; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); opacity: 0; }
  .list { position: absolute; left: 0; right: 0; top: 0; }
  .msg { display: flex; gap: 12px; padding: 10px 18px; }
  .msg.compact { padding-top: 0; margin-top: -6px; }
  .gutter { width: 36px; flex: none; }
  .msg.system { align-items: center; gap: 10px; margin: 2px 18px; padding: 7px 12px; border-radius: 8px; background: rgba(248, 81, 73, 0.12); font: 12.5px var(--mono); color: #ffa198; }
  .icon { width: 18px; height: 18px; flex: none; display: grid; place-items: center; border-radius: 50%; background: #f85149; color: #fff; font: 700 12px var(--sans); }
  .mention { padding: 0 3px; border-radius: 4px; background: rgba(94, 234, 212, 0.14); color: #5eead4; }
  .spam { font: 500 14px var(--mono); }
  .avatar { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 8px; font-size: 13px; font-weight: 600; }
  .msg > div { min-width: 0; }
  .who { display: flex; align-items: baseline; gap: 7px; font-size: 13px; }
  .who b { color: var(--ink); }
  .who em { padding: 0 5px; border-radius: 4px; background: #2a2c31; font: 600 10px/16px var(--sans); font-style: normal; color: var(--soft); }
  .who em.ai { background: #33284a; color: #e2d6fb; }
  .who span { color: var(--muted); font-size: 12px; }
  .who time { color: #4b4f57; font-size: 11.5px; }
  .text { margin-top: 2px; font-size: 14.5px; line-height: 1.5; color: var(--ink-2); }
  .card { margin-top: 6px; display: inline-flex; align-items: center; gap: 12px; padding: 8px 12px 8px 8px; border: 1px solid var(--edge); border-left: 3px solid #fcd34d; border-radius: 8px; background: #121316; }
  .verdict { display: inline-block; padding: 3px 10px; border-radius: 6px; background: rgba(252, 211, 77, 0.14); color: #fcd34d; font: 600 15px var(--mono); }
  .card small { font: 12px var(--mono); color: var(--muted); }

  footer { flex: none; padding: 0 18px 10px; }
  .composer { height: 42px; padding: 0 14px; display: flex; align-items: center; border: 1px solid var(--edge-strong); border-radius: 8px; color: #4b4f57; font-size: 14px; }
  .typing { height: 18px; margin-top: 4px; font-size: 11.5px; color: var(--muted); }
  .typing b { color: var(--soft); font-weight: 500; }

  .said { left: 100px; right: 100px; top: 0; bottom: 0; display: flex; flex-wrap: wrap; align-content: center; justify-content: center; gap: 4px 18px; font: 600 60px/1.15 var(--sans); letter-spacing: -0.045em; color: var(--ink); }
  .said span { display: inline-block; opacity: 0; }
  .said .yeh { font: italic 400 1.2em var(--serif); letter-spacing: -0.02em; color: #5eead4; }
  .said small { flex-basis: 100%; margin-top: 18px; text-align: center; font: 13px var(--mono); letter-spacing: 0.08em; color: var(--muted); opacity: 0; }
  .quote { left: 0; right: 0; top: 226px; margin: 0; text-align: center; font: 600 54px/1.18 var(--sans); letter-spacing: -0.045em; color: var(--ink); transform-origin: 400px 64px; }
  .quote p { opacity: 0; }
  .q2 { position: relative; display: inline-block; }
  .proxy { color: #ffa198; }
  .buddy { position: relative; display: inline-block; }
  .buddy span { background: linear-gradient(90deg, #5eead4, #7dd3fc 55%, #c4a7ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .buddy svg { position: absolute; left: 0; bottom: -10px; width: 100%; height: 16px; overflow: visible; }
  .underline { fill: none; stroke: #5eead4; stroke-width: 4; stroke-linecap: round; }
  .spark { position: absolute; font-size: 24px; font-style: normal; line-height: 1; color: #fcd34d; opacity: 0; }
  .name { left: 0; right: 0; top: 210px; display: flex; justify-content: center; }
  .name h2 { font: 600 80px/1 var(--sans); letter-spacing: -0.045em; color: var(--ink); opacity: 0; }
</style>
