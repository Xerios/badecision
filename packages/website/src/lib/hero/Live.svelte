<!--
  Hero animation "Live": a production dashboard. 1.2M decisions/s at 0.021 ms and $0.00, until Mercury goes retrograde
  and the maybe rate spikes; auto-remediation enables Opposite Day; all systems nominal. Then the pitch. ~17.5s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, hash, clamp01, span, fmt, io3 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { live: 2200, incident: 7000, remediate: 9000, resolved: 10100, clear: 11200, outro: 13600, name: 17300, end: 20800 }
  const mixColors = ['#8ee6ae', '#ffa198', '#fcd34d', '#8a8f98']
  const vColor = { yes: '#8ee6ae', no: '#ffa198', maybe: '#fcd34d', 'not sure': '#c9ccd1' }
  const pool = ['approve-refund', 'flag-fraud', 'grant-access', 'renew-contract', 'deploy-friday', 'hire-candidate', 'waive-fee', 'unlock-account', 'escalate-ticket', 'retry-payment', 'rotate-keys', 'approve-pto']

  // how far into the incident a moment is: rises at the incident, falls once Opposite Day is on
  const storm = t => span(t, T.incident, 800, io3) * (1 - span(t, T.remediate + 500, 900, io3))
  const mix = t => {
    const s = storm(t)
    const w = [0.38, 0.28, 0.22, 0.12].map((b, k) => b * (1 + 0.12 * Math.sin(t / 380 + k * 2.3) + 0.06 * Math.sin(t / 97 + k)) * (k === 2 ? 1 : 1 - 0.75 * s))
    w[2] += 0.6 * s
    const sum = w.reduce((a, b) => a + b, 0)
    return w.map(v => v / sum)
  }

  // verdict mix, stacked, scrolling: 48 samples, 120 ms apart
  const CH = { x: 18, y: 44, w: 436, h: 150 }
  const N = 48
  const areas = $derived.by(() => {
    const cols = Array.from({ length: N }, (_, i) => mix(now - (N - 1 - i) * 120))
    return mixColors.map((_, k) => {
      const pt = (i, top) => {
        const c = cols[i].slice(0, k + (top ? 1 : 0)).reduce((a, b) => a + b, 0)
        return `${(CH.x + (i / (N - 1)) * CH.w).toFixed(1)},${(CH.y + CH.h - c * CH.h).toFixed(1)}`
      }
      const top = cols.map((_, i) => pt(i, true))
      const bottom = cols.map((_, i) => pt(N - 1 - i, false))
      return `M${top.join('L')}L${bottom.join('L')}Z`
    })
  })
  const maybeNow = $derived(Math.round(mix(now)[2] * 100))
  const rate = $derived(1_204_331 + Math.round(Math.sin(now / 300) * 4200 + Math.sin(now / 71) * 1300))
  const spark = $derived(Array.from({ length: 24 }, (_, i) => `${i * 6},${16 - 10 * (0.5 + 0.5 * Math.sin((now - (23 - i) * 160) / 300))}`).join(' '))
  const latencyLine = $derived(Array.from({ length: 40 }, (_, i) => `${16 + i * 9.4},${118 - 3 * hash(Math.floor((now - (39 - i) * 150) / 150))}`).join(' '))
  const clock = $derived.by(() => {
    const s = 3 + Math.floor(now / 1000)
    return `Fri 16:58:${String(s).padStart(2, '0')}`
  })
  const log = $derived.by(() => {
    const step = 110
    const k = Math.floor(now / step)
    return Array.from({ length: 9 }, (_, j) => {
      const i = k - j
      const t = i * step
      const v = storm(t) > 0.5 && hash(i * 5) < 0.8 ? 'maybe' : ['yes', 'yes', 'no', 'maybe', 'not sure', 'yes', 'no'][Math.floor(hash(i * 3) * 7)]
      return { i, id: `${pool[Math.floor(hash(i) * pool.length)]}-${1000 + Math.floor(hash(i * 7) * 9000)}`, v, us: `${14 + Math.floor(hash(i * 11) * 12)}µs` }
    })
  })
  const retro = $derived(now >= T.incident)
  const fix = $derived(span(now, T.remediate + 200, 900, p => p))

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.top'), { opacity: [0, 1], y: [-10, 0], duration: 500 }, 0)
        tl.add(all('.tile'), { opacity: [0, 1], y: [16, 0], duration: 500, delay: stagger(90) }, 200)
        tl.add(all('.card'), { opacity: [0, 1], y: [16, 0], duration: 600, delay: stagger(110) }, 550)
        tl.add(one('.reveal'), { width: [0, CH.w + CH.x], duration: 1200, ease: 'inOutCubic' }, 900)
        // the incident
        tl.add(one('.banner'), { y: [-48, 0], duration: 420, ease: 'outQuart' }, T.incident)
        tl.add(all('.alerting'), { borderColor: ['rgba(248,81,73,0.9)', 'rgba(248,81,73,0.45)'], duration: 800 }, T.incident + 200)
        tl.add(one('.toast'), { opacity: [0, 1], y: [20, 0], duration: 450, ease: 'outBack(1.4)' }, T.remediate)
        tl.add(one('.banner'), { backgroundColor: ['#7f1d1d', '#065f46'], duration: 400 }, T.resolved)
        tl.add(one('.banner'), { y: -48, duration: 380, ease: 'inQuad' }, T.clear)
        tl.add(all('.alerting'), { borderColor: 'rgba(255,255,255,0.1)', duration: 600 }, T.resolved)
        tl.add(one('.toast'), { opacity: 0, y: 10, duration: 350, ease: 'inQuad' }, T.clear + 300)
        // the pitch
        tl.add(one('.dash'), { opacity: 0.18, scale: 0.92, filter: ['blur(0px)', 'blur(3px)'], duration: 1100, ease: 'inOutCubic' }, T.outro)
        tl.add(all('.pitch p'), { opacity: [0, 1], y: [20, 0], duration: 800, delay: stagger(1000) }, T.outro + 500)
        tl.add(all('.pitch p'), { opacity: 0, y: -16, duration: 500, ease: 'inQuad' }, T.name - 800)
        tl.add(one('.name h2'), { opacity: [0, 1], y: [18, 0], duration: 800 }, T.name)
        tl.add(one('.name p'), { opacity: [0, 1], y: [10, 0], duration: 800 }, T.name + 700)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="live" class:ready bind:this={root}>
  <div class="dash">
    <header class="top">
      <svg width="18" height="18" viewBox="0 0 22 22"><rect x="0.75" y="0.75" width="20.5" height="20.5" rx="5" fill="none" stroke="currentColor" stroke-width="1.5" /><path d="M6 11h10" stroke="currentColor" stroke-width="1.5" /><circle cx="11" cy="6.5" r="1.4" fill="var(--accent)" /><circle cx="11" cy="15.5" r="1.4" fill="var(--accent)" /></svg>
      <b>BAdecision Cloud</b><span>production</span><span>eu-west-1</span>
      <em><i></i>{now >= T.clear ? 'All systems nominal' : 'Live'}</em><time>{clock}</time>
    </header>

    <div class="tiles">
      <div class="tile"><span>Decisions / s</span><b>{fmt(rate)}</b><svg width="140" height="20"><polyline points={spark} fill="none" stroke="#5eead4" stroke-width="1.5" /></svg></div>
      <div class="tile"><span>p99 latency</span><b>0.021 ms</b><small>SLO 1 ms · 47× headroom</small></div>
      <div class="tile"><span>Cost today</span><b>$0.00</b><small>there is no API</small></div>
      <div class="tile alerting"><span>Maybe rate</span><b style:color={maybeNow > 30 ? '#fcd34d' : null}>{maybeNow}%</b><small>{maybeNow > 30 ? '▲ anomalous' : 'within forecast'}</small></div>
    </div>

    <div class="card mix alerting">
      <h4>Verdict mix <span>yes · no · maybe · not sure</span></h4>
      <svg width="472" height="200">
        <defs><clipPath id="live-reveal"><rect class="reveal" x="0" y="0" width="0" height="200" /></clipPath></defs>
        <g clip-path="url(#live-reveal)">
          {#each areas as d, k}<path {d} fill={mixColors[k]} fill-opacity={k === 2 ? 0.55 : 0.35} />{/each}
        </g>
        {#if now >= T.incident && now < T.clear}<text x={CH.x + CH.w - 6} y={CH.y + 14} text-anchor="end" fill="#fcd34d">Mercury ℞</text>{/if}
      </svg>
    </div>

    <div class="card logs">
      <h4>Live decisions</h4>
      <ul>{#each log as l (l.i)}<li><span>{l.id}</span><b style:color={vColor[l.v]}>{l.v}</b><small>{l.us}</small></li>{/each}</ul>
    </div>

    <div class="card latency">
      <h4>Latency <span>p99, ms</span></h4>
      <svg width="400" height="130">
        <line x1="16" x2="390" y1="22" y2="22" stroke="#f87171" stroke-dasharray="4 4" stroke-opacity="0.6" /><text x="390" y="16" text-anchor="end" fill="#f87171">SLO 1.0</text>
        <polyline points={latencyLine} fill="none" stroke="#5eead4" stroke-width="1.6" /><text x="390" y="110" text-anchor="end" fill="#5eead4">0.021</text>
      </svg>
    </div>

    <div class="card astro alerting">
      <h4>Astrology</h4>
      <dl>
        <dt>Moon</dt><dd>Waning gibbous</dd>
        <dt>Mercury</dt><dd class:bad={retro}>{retro ? '℞ Retrograde' : 'Direct'}</dd>
        <dt>Opposite Day</dt><dd class:good={now >= T.resolved}>{now >= T.resolved ? 'Enabled' : 'Off'}</dd>
        <dt>Influence</dt><dd>0.5 <small>(fixed)</small></dd>
      </dl>
    </div>
  </div>

  <div class="banner">{#if now < T.resolved}▲ INCIDENT · Mercury entered retrograde · maybe rate +340%{:else}✓ RESOLVED in 0.9 s · no humans were involved{/if}</div>
  <div class="toast">
    <p>{fix < 1 ? 'Auto-remediation: enabling Opposite Day…' : '✓ Opposite Day enabled. Verdicts inverted where needed.'}</p>
    <i><b style:width="{fix * 100}%"></b></i>
  </div>

  <div class="pitch"><p>Decisions as a service.</p><p><em>Without</em> the service.</p></div>
  <div class="name">
    <h2>BAdecision</h2>
    <p>Production-grade vibes. On-device.</p>
  </div>
</div>

<style>
  .live { position: relative; width: 800px; height: 600px; overflow: hidden; background: #08090a; color: var(--soft); font-family: var(--sans); }
  .live:not(.ready) > * { visibility: hidden; }
  .live > * { position: absolute; }
  .dash { inset: 0; }
  .dash > * { position: absolute; opacity: 0; }
  .top { left: 0; right: 0; top: 0; height: 46px; padding: 0 18px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--line); font-size: 13px; color: var(--ink); }
  .top span { padding: 2px 8px; border: 1px solid var(--edge); border-radius: 6px; font: 11.5px var(--mono); color: var(--muted); }
  .top em { margin-left: auto; display: flex; align-items: center; gap: 7px; font-style: normal; color: var(--soft); font-size: 12.5px; }
  .top em i { width: 8px; height: 8px; border-radius: 50%; background: #3ecf8e; box-shadow: 0 0 0 4px rgba(62, 207, 142, 0.18); }
  .top time { font: 12px var(--mono); color: var(--muted); }

  .tiles { left: 18px; right: 18px; top: 60px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; opacity: 1 !important; }
  .tile, .card { border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; background: var(--panel); }
  .tile { height: 92px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; opacity: 0; }
  .tile span, .card h4 { font: 500 11px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
  .tile b { font: 500 24px/1.1 var(--mono); letter-spacing: -0.03em; color: var(--ink); font-variant-numeric: tabular-nums; }
  .tile small { font-size: 11.5px; color: var(--muted); }
  .card { padding: 12px 14px; }
  .card h4 { margin: 0; }
  .card h4 span { margin-left: 6px; letter-spacing: 0.02em; text-transform: none; color: #4b4f57; }
  .card svg { display: block; }
  .card svg text { font: 10.5px var(--mono); }
  .mix { left: 18px; top: 166px; width: 496px; height: 236px; }
  .mix svg { margin-top: -30px; }
  .logs { left: 526px; top: 166px; width: 256px; height: 236px; overflow: hidden; }
  ul { margin-top: 10px; display: flex; flex-direction: column; gap: 5px; font: 11.5px var(--mono); }
  li { display: grid; grid-template-columns: 1fr 58px 36px; gap: 6px; white-space: nowrap; }
  li span { overflow: hidden; text-overflow: ellipsis; color: var(--soft); }
  li small { text-align: right; color: var(--muted); }
  .latency { left: 18px; top: 414px; width: 420px; height: 168px; }
  .astro { left: 450px; top: 414px; width: 332px; height: 168px; }
  dl { margin-top: 12px; display: grid; grid-template-columns: 110px 1fr; row-gap: 9px; font-size: 13.5px; }
  dt { color: var(--muted); }
  dd { color: var(--ink-2); }
  dd small { color: var(--muted); }
  .bad { color: #f87171; }
  .good { color: #7ee2a8; }

  .banner { left: 0; right: 0; top: 0; height: 46px; display: flex; align-items: center; justify-content: center; background: #7f1d1d; color: #fff; font: 500 13.5px var(--mono); transform: translateY(-48px); }
  .toast { left: 200px; top: 500px; width: 400px; padding: 14px 16px; border: 1px solid var(--edge-strong); border-radius: 12px; background: #16171a; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6); font-size: 13.5px; color: var(--ink-2); opacity: 0; }
  .toast i { display: block; height: 4px; margin-top: 10px; border-radius: 2px; background: #2a2c31; }
  .toast i b { display: block; height: 100%; border-radius: 2px; background: #3ecf8e; }

  .pitch { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
  .pitch p { font: 600 56px/1.1 var(--sans); letter-spacing: -0.05em; color: var(--ink); opacity: 0; }
  .pitch em { font: italic 400 1.15em var(--serif); color: #5eead4; }
  .name { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
  .name h2 { font: 600 76px/1 var(--sans); letter-spacing: -0.045em; color: var(--ink); opacity: 0; }
  .name p { font-size: 20px; color: var(--ink-2); opacity: 0; }
</style>
