<!--
  Hero animation "Race": one question, two models. The frontier LLM is still thinking while BAdecision answers, then
  answers four hundred thousand more. A benchmark bar breaks out of its chart; the numbers; the name. ~20.5s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, hash, clamp01, span, typeOut, typedAt, fmt } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { type: 500, run: 2000, copy: 2150, answer: 2450, stream: 3200, think: 2500, reply: 9300, waited: 9900, chart: 12900, stats: 18100, name: 23000, end: 26500 }
  const question = 'Should we deploy on Friday?'
  const reasoning =
    "Okay, the user is asking whether they should deploy on a Friday. This is a nuanced question. Let me think step by step. First, deploying on Friday means fewer people are around if something breaks over the weekend. On the other hand, some teams have strong CI/CD and deploy on any day. I should consider the size of the change, the rollback strategy, the on-call rotation, team morale, and whether the change is behind a feature flag. Wait, I should also consider the user's time zone. Actually, let me reconsider. The question doesn't say what is being deployed. It could be a copy change or a database migration. Hmm. Let me weigh both sides again, more carefully this time. There are several perspectives here, and"
  const PER = 11

  const pool = [
    ['Approve refund #4822?', 'yes'], ['Grant admin to intern-3?', 'no'], ['Flag txn #88213 as fraud?', 'yes'], ['Hire candidate 17?', 'maybe'],
    ['Renew vendor contract?', 'yes'], ['Merge PR #312 unreviewed?', 'no'], ['Rotate API keys?', 'yes'], ['Is it DNS?', 'not sure'],
    ['Waive late fee #41653?', 'yes'], ['Escalate ticket #9921?', 'no'], ['Retry payment #20113?', 'yes'], ['Rollback v2.0.7?', 'maybe'],
    ['Unlock account akim?', 'no'], ['Approve PTO for jdoe?', 'yes'], ['Cancel standup?', 'yes'], ['Reply-all?', 'no'],
  ]
  const color = { yes: '#8ee6ae', no: '#ffa198', maybe: '#fcd34d', 'not sure': '#c9ccd1' }
  const emissions = (() => {
    const out = []
    for (let t = T.stream, gap = 420; t < T.reply; t += gap, gap = Math.max(12, gap * 0.86)) out.push(t)
    return out
  })()
  const rows = emissions.map((at, i) => {
    const [q, v] = pool[Math.floor(hash(i * 7 + 1) * pool.length)]
    return { at, q, v, ms: `0.0${1 + Math.floor(hash(i * 3) * 3)} ms` }
  })

  const typed = $derived(typeOut(question, now, T.type, 42))
  const spinner = $derived('⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'[Math.floor(now / 80) % 10])
  const thought = $derived(typeOut(reasoning, Math.min(now, T.reply), T.think, PER))
  const tokens = $derived(Math.floor(thought.length / 3.4) + (now > T.copy ? 41 : 0))
  const elapsed = $derived(clamp01((now - T.copy) / (T.reply - T.copy)) * (T.reply - T.copy) / 1000)
  const thinking = $derived(now >= T.copy && now < T.reply)
  const visibleRows = $derived(rows.filter(r => r.at <= now).slice(-11))
  const count = $derived(now < T.answer ? 0 : Math.floor(10 ** (5.623 * clamp01((now - T.answer) / (T.reply - T.answer)) ** 1.7)))
  // stats count from the competitor's numbers down to ours
  const s1 = $derived(Math.round(10 ** (5.623 * (1 - span(now, T.stats + 200, 1100))) * 20) / 20)
  const s2 = $derived(0.031 * (1 - span(now, T.stats + 650, 1100)))
  const s3 = $derived(12 * (1 - span(now, T.stats + 1100, 1100)))
  const latency = $derived(s1 >= 1e6 ? `${(s1 / 1e6).toFixed(1)} s` : s1 >= 1000 ? `${fmt(s1 / 1000)} ms` : `~${fmt(Math.max(20, s1))} µs`)

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        // the question, typed once, sent to both
        tl.add(one('.ask'), { opacity: [0, 1], y: [-10, 0], duration: 500 }, 0)
        tl.add(all('.pane'), { opacity: [0, 1], y: [24, 0], duration: 600, delay: stagger(120) }, 250)
        tl.add(one('.ask button'), { scale: [{ to: 0.92, duration: 80 }, { to: 1, duration: 260, ease: 'outBack(2)' }], backgroundColor: ['#f7f8f8', '#2dd4bf', '#f7f8f8'] }, T.run)
        all('.sent').forEach((el, i) => tl.add(el, { opacity: [0, 1], x: [i ? 60 : -60, 0], y: [-40, 0], duration: 420, ease: 'outQuart' }, T.copy))
        // BAdecision answers at once
        tl.add(one('.verdict'), { opacity: [0, 1], scale: [1.25, 1], duration: 380, ease: 'outBack(1.8)' }, T.answer)
        tl.add(one('.right .flash'), { opacity: [0.5, 0], duration: 700 }, T.answer)
        tl.add(one('.right .pill'), { backgroundColor: ['rgba(45,212,191,0.6)', 'rgba(45,212,191,0.14)'], duration: 600 }, T.answer)
        // the LLM, eventually
        tl.add(one('.reply'), { opacity: [0, 1], y: [10, 0], duration: 500 }, T.reply)
        tl.add(one('.waited'), { opacity: [0, 1], scale: [0.9, 1], duration: 600, ease: 'outBack(1.6)' }, T.waited)
        // benchmark: our bar breaks out of the chart
        tl.add(all('.pane, .ask'), { opacity: 0, y: -16, duration: 600, ease: 'inQuad', delay: stagger(80) }, T.chart - 1000)
        tl.add(one('.chart'), { opacity: [0, 1], y: [20, 0], duration: 700 }, T.chart)
        all('.bar:not(.ours)').forEach((el, i) => tl.add(el, { width: [0, +el.dataset.w], duration: 700 }, T.chart + 500 + i * 180))
        tl.add(one('.bar.ours'), { width: [{ to: 380, duration: 1000, ease: 'inQuad' }, { to: 620, duration: 500, ease: 'outExpo' }] }, T.chart + 1400)
        tl.add(one('.chart'), { x: [{ to: 7, duration: 50 }, { to: -5, duration: 50 }, { to: 3, duration: 60 }, { to: 0, duration: 80 }], borderRightColor: ['#2dd4bf', 'rgba(255,255,255,0.1)'] }, T.chart + 2400)
        tl.add(one('.ours-value'), { opacity: [0, 1], x: [-20, 0], duration: 500 }, T.chart + 2600)
        tl.add(one('.chart small'), { opacity: [0, 1], duration: 600 }, T.chart + 3400)
        // the numbers
        tl.add(one('.chart'), { opacity: 0, scale: 0.96, duration: 550, ease: 'inQuad' }, T.stats - 850)
        tl.add(all('.stat'), { opacity: [0, 1], y: [24, 0], duration: 700, delay: stagger(450) }, T.stats)
        tl.add(one('.fine'), { opacity: [0, 0.8], duration: 700 }, T.stats + 2600)
        // the name
        tl.add(all('.stat, .fine'), { opacity: 0, y: -14, duration: 550, ease: 'inQuad', delay: stagger(60) }, T.name - 900)
        tl.add(one('.name h2'), { opacity: [0, 1], y: [18, 0], letterSpacing: ['0.02em', '-0.045em'], duration: 900 }, T.name)
        tl.add(one('.name p'), { opacity: [0, 1], y: [10, 0], duration: 800 }, T.name + 700)
        tl.add(one('.name code'), { opacity: [0, 1], scale: [0.9, 1], duration: 600, ease: 'outBack(1.6)' }, T.name + 1400)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="race" class:ready bind:this={root}>
  <div class="ask">
    <span>›</span><b>{typed}<i class:on={now < T.run && Math.floor(now / 500) % 2 === 0}></i></b><button type="button" tabindex="-1">Ask both ⏎</button>
  </div>

  <section class="pane left">
    <header><span>frontier-llm-pro</span><span class="pill">{#if thinking}{spinner} Thinking{:else if now >= T.reply}Done{:else}Ready{/if}</span></header>
    <div class="body">
      <p class="sent">› {question}</p>
      <div class="stream">
        <p class="thought">{thought}{#if thinking}<i class="on"></i>{/if}</p>
        <p class="reply"><b>It depends.</b></p>
      </div>
    </div>
    <footer><span>{fmt(tokens)} tokens</span><span>${(tokens * 0.0000147).toFixed(4)}</span><span>{elapsed.toFixed(1)} s</span></footer>
  </section>

  <section class="pane right">
    <div class="flash"></div>
    <header><span>badecision <small>2.0.2 · wasm</small></span><span class="pill">{now >= T.answer ? '✓ Done' : 'Ready'}</span></header>
    <div class="body">
      <p class="sent">› {question}</p>
      <p class="verdict"><b>→ NO</b><span>0.02 ms · $0.00</span></p>
      <ul>
        {#each visibleRows as r (r.at)}<li><span>{r.q}</span><b style:color={color[r.v]}>{r.v.toUpperCase()}</b><small>{r.ms}</small></li>{/each}
      </ul>
      <p class="waited"><b>{fmt(count)}</b> decisions while it was thinking</p>
    </div>
    <footer><span>{fmt(count)} decisions</span><span>$0.00</span><span>0.02 ms</span></footer>
  </section>

  <div class="chart">
    <h3>Decisions per second <span>higher is better</span></h3>
    <dl>
      <dt>Frontier LLM (thinking)</dt><dd><i class="bar" data-w="12"></i><span>0.12/s</span></dd>
      <dt>Leading decision model</dt><dd><i class="bar" data-w="133"></i><span>3.1k/s</span></dd>
      <dt>BAdecision 2.0</dt><dd><i class="bar ours"></i></dd>
    </dl>
    <span class="ours-value">50,000/s →</span>
    <small>Bar truncated by the edge of your screen.</small>
  </div>

  <div class="stats">
    <div class="stat"><b>{latency}</b><span>per decision</span></div>
    <div class="stat"><b>${s2.toFixed(s2 > 0.0005 ? 3 : 2)}</b><span>API costs. There is no API.</span></div>
    <div class="stat"><b>{fmt(s3, s3 > 0.05 ? 1 : 0)}%</b><span>hallucination, schema-guaranteed</span></div>
  </div>
  <p class="fine">Internal evaluation on TrustMeBench (unreleased). Workloads designed by our own team.</p>

  <div class="name">
    <h2>BAdecision</h2>
    <p>The <em>decision</em> infrastructure for the modern enterprise.</p>
    <code>npm install badecision</code>
  </div>
</div>

<style>
  .race { position: relative; width: 800px; height: 600px; overflow: hidden; background: radial-gradient(600px 400px at 50% 0%, #0d1214, #07080a); color: var(--soft); font-family: var(--sans); }
  .race:not(.ready) > * { visibility: hidden; }
  .race > * { position: absolute; }
  i.on { display: inline-block; width: 0.5em; height: 1.05em; margin-left: 2px; vertical-align: -0.15em; background: currentColor; }
  i:not(.on) { display: inline-block; width: 0.5em; }

  .ask { top: 34px; left: 120px; width: 560px; height: 48px; padding: 0 6px 0 18px; display: flex; align-items: center; gap: 12px; border: 1px solid var(--edge-strong); border-radius: 12px; background: var(--panel); font: 17px var(--mono); opacity: 0; }
  .ask > span { color: var(--muted); }
  .ask b { flex: 1; font-weight: 400; color: var(--ink); white-space: pre; }
  .ask button { height: 36px; padding: 0 14px; border: 0; border-radius: 8px; background: #f7f8f8; color: #08090a; font: 500 13px var(--sans); }

  .pane { top: 106px; width: 365px; height: 370px; display: flex; flex-direction: column; border: 1px solid var(--edge); border-radius: 14px; background: rgba(15, 16, 17, 0.9); overflow: hidden; opacity: 0; }
  .left { left: 26px; }
  .right { left: 409px; border-color: rgba(45, 212, 191, 0.3); }
  .flash { position: absolute; inset: 0; background: #2dd4bf; opacity: 0; pointer-events: none; }
  .pane header, .pane footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 12.5px; }
  .pane header { border-bottom: 1px solid var(--line); color: var(--ink-2); font-weight: 500; }
  .pane header small { color: var(--muted); font-weight: 400; }
  .pill { padding: 2px 9px; border-radius: 999px; background: rgba(255, 255, 255, 0.06); font: 11.5px var(--mono); color: var(--soft); }
  .right .pill { background: rgba(45, 212, 191, 0.14); color: #5eead4; }
  .pane footer { margin-top: auto; border-top: 1px solid var(--line); font: 11.5px var(--mono); color: var(--muted); }
  .body { position: relative; flex: 1; min-height: 0; padding: 14px; display: flex; flex-direction: column; gap: 10px; font-family: var(--mono); }
  .sent { font-size: 13px; color: var(--ink); opacity: 0; }
  .stream { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; }
  .thought { font-size: 12px; line-height: 1.55; color: var(--muted); font-style: italic; }
  .reply { margin-top: 8px; font-size: 18px; color: var(--ink); opacity: 0; }
  .verdict { display: flex; align-items: baseline; justify-content: space-between; opacity: 0; transform-origin: left center; }
  .verdict b { font-size: 30px; font-weight: 500; color: #ffa198; }
  .verdict span { font-size: 12px; color: var(--muted); }
  ul { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; font-size: 11.5px; }
  li { display: grid; grid-template-columns: 1fr 64px 52px; gap: 6px; padding: 2px 0; white-space: nowrap; }
  li span { overflow: hidden; text-overflow: ellipsis; color: var(--soft); }
  li b { font-weight: 500; }
  li small { text-align: right; color: var(--muted); }
  .waited { position: absolute; left: 14px; right: 14px; bottom: 14px; padding: 12px 14px; border: 1px solid rgba(45, 212, 191, 0.4); border-radius: 10px; background: rgba(8, 20, 19, 0.96); font: 13px var(--sans); color: var(--soft); opacity: 0; }
  .waited b { display: block; font: 500 26px var(--mono); color: #5eead4; }

  .chart { top: 130px; left: 70px; width: 660px; padding: 26px 28px 22px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; background: var(--panel); opacity: 0; }
  .chart h3 { font-size: 18px; letter-spacing: -0.02em; }
  .chart h3 span { margin-left: 8px; font: 12px var(--mono); color: var(--muted); }
  .chart dl { margin-top: 22px; display: grid; grid-template-columns: 190px 1fr; row-gap: 20px; align-items: center; }
  .chart dt { font-size: 14px; color: var(--soft); }
  .chart dt:nth-last-of-type(1) { color: #5eead4; font-weight: 500; }
  .chart dd { display: flex; align-items: center; gap: 10px; font: 12px var(--mono); color: var(--muted); }
  .bar { display: block; flex: none; width: 0; height: 18px; border-radius: 4px; background: var(--bar); }
  .bar.ours { background: linear-gradient(90deg, #14b8a6, #5eead4); box-shadow: 0 0 24px rgba(45, 212, 191, 0.5); }
  .ours-value { position: absolute; right: 22px; bottom: 58px; font: 500 13px var(--mono); color: #042f2e; opacity: 0; }
  .chart small { display: block; margin-top: 18px; font-size: 11.5px; color: var(--muted); opacity: 0; }

  .stats { top: 200px; left: 40px; right: 40px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; }
  .stat { opacity: 0; }
  .stat b { display: block; font: 500 52px/1.1 var(--sans); letter-spacing: -0.04em; color: var(--ink); font-variant-numeric: tabular-nums; }
  .stat span { display: block; margin-top: 10px; font-size: 14px; color: var(--muted); }
  .fine { left: 0; right: 0; bottom: 120px; text-align: center; font: 11px var(--mono); color: var(--muted); opacity: 0; }

  .name { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; text-align: center; }
  .name h2 { font: 600 76px/1 var(--sans); letter-spacing: -0.045em; color: var(--ink); opacity: 0; }
  .name p { font-size: 20px; color: var(--ink-2); opacity: 0; }
  .name em { font: italic 400 1.15em var(--serif); }
  .name code { margin-top: 8px; padding: 9px 16px; border: 1px solid var(--edge-strong); border-radius: 10px; background: var(--panel); font-size: 14px; color: var(--ink-2); opacity: 0; }
</style>
