<!--
  Hero animation "Ship it": a developer's afternoon. npm install, ask it something in the REPL, delete 14,212 lines of
  business logic for one isItTrue, run the one test, push on a Friday. Badges, name. ~19s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, hash, clamp01, span, typeOut, fmt, io3 } from './stage.js'
  import { badges } from '#lib/content.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { editor: 8300, red: 9000, scroll: 9600, collapse: 11300, back: 13700, badges: 19100, name: 21300, end: 25000 }
  const DELETED = 14212

  // the terminal session: commands are typed, output appears at once; `group` 1 is cleared when we come back
  const P = '~/acme-billing $ '
  const session = [
    { at: 300, cmd: P, text: 'npm install badecision', per: 45 },
    { at: 1500, until: 2100, text: '⠙ reify:badecision: timing reifyNode:node_modules/badecision', cls: 'dim' },
    { at: 2100, text: 'added 1 package, and audited 2 packages in 412ms' },
    { at: 2300, html: 'found <b class="ok">0</b> vulnerabilities' },
    { at: 2900, cmd: P, text: 'node', per: 60 },
    { at: 3250, text: 'Welcome to Node.js v24.11.0.', cls: 'dim' },
    { at: 3400, cmd: '> ', text: "const { isIt } = await import('badecision')", per: 26 },
    { at: 4700, text: 'undefined', cls: 'dim' },
    { at: 4950, cmd: '> ', text: "isIt('Should I use this in production?')", per: 34 },
    { at: 6500, text: "'maybe'", cls: 'maybe' },
    { at: 13900, group: 2, cmd: P, text: 'npm test', per: 50 },
    { at: 14600, group: 2, html: '<b class="pass">PASS</b> test/badecision.test.js' },
    { at: 14800, group: 2, html: '  <b class="ok">✓</b> it decides <span class="dim">(0.02 ms)</span>' },
    { at: 15200, group: 2, html: 'Tests:       <b class="ok">1 passed</b>, 1 total' },
    { at: 15400, group: 2, html: 'Coverage:    <b class="ok">100%</b>' },
    { at: 15600, group: 2, text: 'Assertions:  0', cls: 'dim' },
    { at: 16300, group: 2, cmd: P, text: 'git push origin main', per: 40 },
    { at: 17300, group: 2, html: '<b class="teal">→</b> deployed to production · <b class="teal">Fri 16:58</b>' },
  ]
  const lines = $derived(
    session
      .filter(l => l.at <= now && (l.until === undefined || now < l.until) && ((l.group ?? 1) === 2) === now >= T.back)
      .map(l => ({ ...l, shown: l.cmd ? typeOut(l.text, now, l.at, l.per) : l.text, typing: l.cmd && now < l.at + l.text.length * l.per + 200 })),
  )
  const blink = $derived(Math.floor(now / 500) % 2 === 0)

  // business logic, to be deleted
  const conds = ["refund.amount > policy.autoApproveLimit", "customer.tier === 'gold'", 'customer.tenureMonths > 24', '!fraud.score(refund).isHigh', "refund.reason !== 'changed-mind'", "order.region === 'EU'", 'isBusinessDay(now)', 'manager.approvals.length >= 2', "flags.isEnabled('refund-v3')", 'refund.items.some(isPerishable)', 'customer.chargebacks < 3', 'Date.now() - order.placedAt < 30 * DAY']
  const acts = ['return approve(refund)', "return escalate(refund, 'tier-review')", 'return reject(refund)', 'return approveWithin(14)', "audit.log('manual', refund.id)", 'return holdForReview(refund)', "notify(finance, 'refund', refund)", 'retries += 1']
  const code = (() => {
    const out = [{ n: 1, depth: 0, text: 'export function shouldApproveRefund(refund, customer, policy) {' }]
    let d = 1
    for (let i = 1; i < 84; i++) {
      const r = hash(i * 7)
      const pick = (list, k) => list[Math.floor(hash(i * k) * list.length)]
      if ((r < 0.42 && d < 5) || d === 1) out.push({ n: i + 1, depth: d++, text: `if (${pick(conds, 3)} && ${pick(conds, 5)}) {` })
      else if (r < 0.78) out.push({ n: i + 1, depth: d, text: pick(acts, 11) })
      else out.push({ n: i + 1, depth: --d, text: '}' })
    }
    return out
  })()
  const VISIBLE = 15
  const LINE = 20
  const scrollY = $derived(io3(clamp01((now - T.scroll) / (T.collapse - T.scroll))) * (code.length - VISIBLE) * LINE)
  const deleted = $derived(Math.floor(DELETED * span(now, T.scroll - 200, T.collapse - T.scroll + 200, p => p ** 2.2)))
  const redUntil = $derived((now - T.red) / 18) // lines turn red top to bottom, then everything scrolled in is red

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        const term = one('.term')
        tl.add(term, { opacity: [0, 1], scale: [0.96, 1], duration: 600 }, 0)
        tl.add(one('.maybe-glow'), { opacity: [0, 0.9, 0.35], scale: [0.6, 1.2], duration: 900 }, 6500)

        // the editor slides over; the logic goes red, scrolls away, collapses, one line remains
        tl.add(term, { scale: 0.94, opacity: 0.35, x: -30, duration: 700, ease: 'inOutCubic' }, T.editor - 100)
        tl.add(one('.editor'), { opacity: [0, 1], x: [80, 0], duration: 750, ease: 'outQuart' }, T.editor)
        tl.add(one('.stat'), { opacity: [0, 1], y: [-6, 0], duration: 400 }, T.scroll - 200)
        tl.add(one('.deleted'), { opacity: 0, scaleY: 0.2, duration: 450, ease: 'inQuad' }, T.collapse)
        tl.add(one('.added'), { opacity: [0, 1], x: [-16, 0], duration: 600, ease: 'outQuart' }, T.collapse + 500)
        tl.add(one('.added'), { backgroundColor: ['rgba(46,160,67,0.55)', 'rgba(46,160,67,0.16)'], duration: 1200 }, T.collapse + 500)
        tl.add(one('.summary'), { opacity: [0, 1], duration: 600 }, T.collapse + 1200)
        tl.add(one('.editor'), { opacity: 0, x: 60, duration: 550, ease: 'inQuad' }, T.back - 500)
        tl.add(term, { scale: 1, opacity: 1, x: 0, duration: 600, ease: 'inOutCubic' }, T.back - 200)
        tl.add(one('.deploy-glow'), { opacity: [0, 0.8, 0], duration: 1600 }, 17300)

        // badges, name
        tl.add(term, { opacity: 0, scale: 0.92, y: -40, duration: 600, ease: 'inQuad' }, T.badges - 800)
        tl.add(all('.badge'), { opacity: [0, 1], scale: [1.35, 1], y: [-10, 0], duration: 420, ease: 'outBack(1.6)', delay: stagger(160) }, T.badges)
        tl.add(one('.badges'), { y: -70, duration: 900, ease: 'inOutCubic' }, T.name - 400)
        tl.add(one('.name h2'), { opacity: [0, 1], y: [20, 0], duration: 900 }, T.name + 200)
        tl.add(one('.name p'), { opacity: [0, 1], y: [10, 0], duration: 800 }, T.name + 900)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="ship" class:ready bind:this={root}>
  <section class="term">
    <header><i></i><i></i><i></i><span>acme-billing — zsh — 96×24</span></header>
    <div class="screen">
      {#each lines as l, i}
        <p class={l.cls}>
          {#if l.cmd}<span class="prompt">{l.cmd}</span>{l.shown}{#if i === lines.length - 1 && (l.typing || blink)}<i class="caret"></i>{/if}
          {:else if l.html}{@html l.html}
          {:else}{l.text}{/if}
        </p>
      {/each}
    </div>
    <div class="maybe-glow"></div>
    <div class="deploy-glow"></div>
  </section>

  <section class="editor">
    <header>
      <span class="tab">rules.ts <small>src/billing</small></span>
      <span class="stat"><b class="del">−{fmt(deleted)}</b> <b class="add">+{now >= T.collapse + 500 ? 1 : 0}</b></span>
    </header>
    <div class="code">
      <div class="deleted">
        <div style:transform="translateY({-scrollY}px)">
          {#each code as c, i}
            <p class:red={i < redUntil}><span class="ln">{c.n}</span><span class="sign">{i < redUntil ? '−' : ' '}</span>{'  '.repeat(c.depth)}{c.text}</p>
          {/each}
        </div>
      </div>
      <p class="added"><span class="ln">1</span><span class="sign">+</span>if (isItTrue(`Approve refund ${'{'}refund.id{'}'}?`)) approve(refund)</p>
      <p class="summary">1 file changed, <b class="add">1 insertion(+)</b>, <b class="del">{fmt(DELETED)} deletions(−)</b></p>
    </div>
  </section>

  <ul class="badges">
    {#each badges as [label, value, color]}<li class="badge"><span>{label}</span><span style:background={color}>{value}</span></li>{/each}
  </ul>
  <div class="name">
    <h2>BAdecision</h2>
    <p>Decisions as a service, <em>without</em> the service.</p>
  </div>
</div>

<style>
  .ship { position: relative; width: 800px; height: 600px; overflow: hidden; background: radial-gradient(700px 420px at 30% 10%, #0f1316, #07080a); color: var(--soft); font-family: var(--sans); }
  .ship:not(.ready) > * { visibility: hidden; }
  .ship > * { position: absolute; }

  section { border: 1px solid var(--edge-strong); border-radius: 12px; background: #0c0d0f; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55); overflow: hidden; }
  section header { height: 36px; padding: 0 14px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--line); background: #121316; font-size: 12px; color: var(--muted); }

  .term { left: 70px; top: 120px; width: 660px; height: 340px; opacity: 0; }
  .term header i { width: 11px; height: 11px; border-radius: 50%; background: #3a3d44; }
  .term header i:nth-child(1) { background: #ff5f57; }
  .term header i:nth-child(2) { background: #febc2e; }
  .term header i:nth-child(3) { background: #28c840; }
  .term header span { flex: 1; text-align: center; margin-right: 50px; }
  .screen { height: 304px; padding: 16px 18px; display: flex; flex-direction: column; justify-content: flex-start; gap: 3px; overflow: hidden; font: 15px/1.6 var(--mono); color: var(--ink-2); white-space: pre; }
  .prompt { color: #5eead4; }
  .caret { display: inline-block; width: 0.55em; height: 1.1em; margin-left: 1px; vertical-align: -0.2em; background: var(--ink); }
  .dim, .screen :global(.dim) { color: var(--muted); }
  .maybe { color: #fcd34d; font-size: 22px; }
  .screen :global(.ok) { color: #7ee2a8; font-weight: 500; }
  .screen :global(.teal) { color: #5eead4; font-weight: 500; }
  .screen :global(.pass) { padding: 0 6px; border-radius: 3px; background: #2ea043; color: #fff; font-weight: 600; }
  .maybe-glow, .deploy-glow { position: absolute; left: 0; right: 0; bottom: 0; height: 160px; pointer-events: none; opacity: 0; }
  .maybe-glow { background: radial-gradient(260px 90px at 25% 45%, rgba(252, 211, 77, 0.18), transparent); }
  .deploy-glow { background: radial-gradient(320px 90px at 30% 85%, rgba(45, 212, 191, 0.22), transparent); }

  .editor { left: 110px; top: 96px; width: 640px; height: 400px; opacity: 0; }
  .tab { color: var(--ink-2); }
  .tab small { margin-left: 6px; color: var(--muted); }
  .stat { margin-left: auto; font: 13px var(--mono); opacity: 0; }
  .del { color: #ff7b72; font-weight: 500; }
  .add { color: #7ee2a8; font-weight: 500; }
  .code { position: relative; height: 364px; padding: 10px 0; font: 12.5px/20px var(--mono); color: var(--soft); white-space: pre; }
  .deleted { height: 300px; overflow: hidden; transform-origin: top center; }
  .code p { height: 20px; padding-right: 12px; }
  .red { background: rgba(248, 81, 73, 0.14); color: #ffa198; }
  .ln { display: inline-block; width: 44px; padding-right: 12px; text-align: right; color: #4b4f57; }
  .sign { display: inline-block; width: 18px; color: inherit; }
  .added { position: absolute; top: 10px; left: 0; right: 0; background: rgba(46, 160, 67, 0.16); color: #aff5b4; opacity: 0; }
  .summary { position: absolute; left: 20px; bottom: 16px; font-size: 13px; color: var(--muted); opacity: 0; }

  .badges { top: 268px; left: 40px; right: 40px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .badge { display: flex; border-radius: 5px; overflow: hidden; font: 500 14px/1 var(--sans); opacity: 0; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4); }
  .badge span { padding: 7px 10px; color: #fff; }
  .badge span:first-child { background: #555; }
  .name { left: 0; right: 0; top: 300px; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
  .name h2 { font: 600 76px/1 var(--sans); letter-spacing: -0.045em; color: var(--ink); opacity: 0; }
  .name p { font-size: 20px; color: var(--ink-2); opacity: 0; }
  .name em { font: italic 400 1.15em var(--serif); }
</style>
