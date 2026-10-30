<!--
  Hero animation "Forecast": the decision weather report. Sunny yeses over the office until a Mercury retrograde front
  rolls in from the west and turns everything to maybe; the five-day outlook ends in a severe NO on Friday. ~14s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, clamp01, io3 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { map: 400, front: 4000, frontEnd: 8600, outlook: 9600, end: 14200 }
  // rooms of the office: name, x, y, w, h, before, after the front
  const rooms = [
    ['Engineering', 40, 20, 220, 140, ['☀️', 'YES', 82], ['⛈️', 'NO', 71]],
    ['Sales', 270, 20, 150, 140, ['☀️', 'YES', 95], ['🌧️', 'MAYBE', 64]],
    ['Legal', 430, 20, 150, 140, ['🌫️', 'NOT SURE', 88], ['🌫️', 'NOT SURE', 99]],
    ['Finance', 40, 170, 160, 120, ['⛅', 'MAYBE', 55], ['🌧️', 'MAYBE', 77]],
    ['Deploys', 210, 170, 210, 120, ['☀️', 'YES', 70], ['⛈️', 'NO', 93]],
    ['Exec', 430, 170, 150, 120, ['☀️', 'YES', 100], ['⛅', 'MAYBE', 51]],
  ]
  const frontX = $derived(-40 + 700 * io3(clamp01((now - T.front) / (T.frontEnd - T.front))))
  const passed = i => frontX > rooms[i][1] + rooms[i][3] / 2
  const ticker = '70% chance of maybe this afternoon  ·  Legal: scattered unsure, as always  ·  Deploys: severe NO warning in effect until Monday  ·  Mercury retrograde until Nov 13  ·  Wear a jacket. Maybe.  ·  '
  const outlook = [['Mon', '☀️', 'YES'], ['Tue', '⛅', 'MAYBE'], ['Wed', '🌧️', 'MAYBE'], ['Thu', '☀️', 'YES'], ['Fri', '⛈️', 'NO']]
  const color = { YES: '#22c55e', NO: '#ef4444', MAYBE: '#eab308', 'NOT SURE': '#94a3b8' }

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.studio'), { opacity: [0, 1], duration: 600 }, 0)
        tl.add(all('.room'), { opacity: [0, 1], scale: [0.9, 1], duration: 500, delay: stagger(90) }, T.map)
        tl.add(one('.lower'), { x: [-800, 0], duration: 700, ease: 'outQuart' }, 900)
        tl.add(one('.front-label'), { opacity: [0, 1], duration: 400 }, T.front + 300)
        tl.add(one('.front-label'), { opacity: 0, duration: 400 }, T.frontEnd)
        tl.add(one('.map'), { opacity: 0.12, scale: 0.94, duration: 700, ease: 'inOutSine' }, T.outlook - 300)
        tl.add(one('.outlook h3'), { opacity: [0, 1], y: [10, 0], duration: 500 }, T.outlook)
        tl.add(all('.day'), { opacity: [0, 1], y: [20, 0], duration: 500, delay: stagger(220) }, T.outlook + 300)
        tl.add(one('.day.fri'), { scale: [{ to: 1.12, duration: 200 }, { to: 1.06, duration: 300 }], boxShadow: ['0 0 0 rgba(239,68,68,0)', '0 0 40px rgba(239,68,68,0.6)'] }, T.outlook + 1700)
        tl.add(one('.severe'), { opacity: [0, 1], scale: [1.4, 1], duration: 400, ease: 'outBack(2)' }, T.outlook + 2000)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="forecast" class:ready bind:this={root}>
  <div class="studio">
    <p class="tag"><b>DECISION FORECAST</b> Friday · Acme HQ</p>
    <div class="map">
      <svg width="620" height="300" viewBox="0 0 620 300">
        {#each rooms as [name, x, y, w, h, before, after], i}
          {@const [icon, v, pct] = passed(i) ? after : before}
          <g class="room" style:transform-origin="{x + w / 2}px {y + h / 2}px">
            <rect {x} {y} width={w} height={h} rx="10" fill={passed(i) ? '#1e293b' : '#1d3557'} stroke="rgba(255,255,255,0.25)" />
            <text x={x + 12} y={y + 22} class="rname">{name}</text>
            <text x={x + w / 2} y={y + h / 2 + 14} text-anchor="middle" class="icon">{icon}</text>
            <text x={x + w - 12} y={y + h - 14} text-anchor="end" class="verdict" fill={color[v]}>{v} {pct}%</text>
          </g>
        {/each}
        <g transform="translate({frontX} 0)" opacity={now > T.front && now < T.frontEnd + 300 ? 1 : 0}>
          <line x1="0" x2="0" y1="0" y2="300" stroke="#3b82f6" stroke-width="5" />
          {#each Array(8) as _, k}<path d="M 0 {k * 38 + 10} l 14 10 l -14 10 z" fill="#3b82f6" />{/each}
          {#each Array(7) as _, k}<circle cx="0" cy={k * 38 + 34} r="7" fill="#ef4444" />{/each}
        </g>
      </svg>
      <p class="front-label" style:left="{Math.max(0, frontX - 70)}px">Mercury retrograde front →</p>
    </div>
    <div class="outlook">
      <h3>5-day outlook</h3>
      <div class="days">
        {#each outlook as [d, icon, v]}<div class="day" class:fri={d === 'Fri'}><small>{d}</small><span>{icon}</span><b style:color={color[v]}>{v}</b></div>{/each}
      </div>
      <p class="severe">⚠ Severe NO warning · Friday</p>
    </div>
    <div class="lower">
      <b>LIVE</b><span>BAdecision Weather</span>
      <p><span style:transform="translateX({-((now * 0.09) % 900)}px)">{ticker}{ticker}</span></p>
    </div>
  </div>
</div>

<style>
  .forecast { position: relative; width: 800px; height: 600px; overflow: hidden; background: #050816; font-family: var(--sans); color: #fff; }
  .forecast:not(.ready) > * { visibility: hidden; }
  .forecast > * { position: absolute; }
  .studio { inset: 0; background: radial-gradient(600px 400px at 50% 40%, #12306b, #050816); opacity: 0; }
  .tag { position: absolute; left: 40px; top: 30px; font-size: 16px; color: #cbd5e1; }
  .tag b { margin-right: 10px; padding: 4px 10px; border-radius: 4px; background: #ef4444; color: #fff; font: 800 13px var(--sans); letter-spacing: 0.08em; }
  .map { position: absolute; left: 90px; top: 80px; width: 620px; height: 300px; transform-origin: center; }
  .room { opacity: 0; }
  .rname { font: 600 13px var(--sans); fill: #cbd5e1; }
  .icon { font-size: 46px; }
  .verdict { font: 700 13px var(--mono); }
  .front-label { position: absolute; top: -26px; white-space: nowrap; font: 700 13px var(--sans); color: #93c5fd; opacity: 0; }
  .outlook { position: absolute; left: 60px; right: 60px; top: 110px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .outlook h3 { color: #fff; font: 700 26px var(--sans); letter-spacing: -0.02em; opacity: 0; }
  .days { display: flex; gap: 12px; }
  .day { width: 112px; padding: 14px 0; display: flex; flex-direction: column; align-items: center; gap: 6px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; background: rgba(15, 23, 42, 0.85); opacity: 0; }
  .day small { font: 600 13px var(--sans); color: #cbd5e1; }
  .day span { font-size: 40px; }
  .day b { font: 700 14px var(--mono); }
  .day.fri { border-color: #ef4444; }
  .severe { padding: 8px 16px; border-radius: 8px; background: #ef4444; font: 700 15px var(--sans); opacity: 0; }
  .lower { position: absolute; left: 0; right: 0; bottom: 30px; height: 64px; display: grid; grid-template-columns: auto auto 1fr; align-items: center; background: rgba(2, 6, 23, 0.92); border-top: 3px solid #ef4444; }
  .lower > b { height: 100%; display: grid; place-items: center; padding: 0 16px; background: #ef4444; font: 800 14px var(--sans); letter-spacing: 0.1em; }
  .lower > span { padding: 0 16px; font: 700 16px var(--sans); border-right: 1px solid rgba(255, 255, 255, 0.2); }
  .lower p { overflow: hidden; white-space: nowrap; font-size: 15px; color: #e2e8f0; }
  .lower p span { display: inline-block; padding-left: 16px; }
</style>
