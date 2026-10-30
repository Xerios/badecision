<!--
  Hero animation "Legal": the license (MIT AND UNLICENSED) under review. Six weeks of highlighter, red pen, sticky notes
  and one coffee ring, then a rubber stamp with a single word: MAYBE. ~12.5s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger, createDrawable } from 'animejs'
  import { play, hash, clamp01 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { doc: 0, weeks: 900, stamp: 7600, caption: 9000, end: 12800 }
  const week = $derived(Math.min(6, 1 + Math.floor(clamp01((now - T.weeks) / 6000) * 6)))
  const sections = [
    ['1.', 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software.'],
    ['2.', 'Permission is hereby not granted.'],
    ['3.', 'Where sections 1 and 2 disagree, see section 3.'],
    ['4.', 'THE SOFTWARE IS PROVIDED "AS IS", "AS ISN\'T", AND "MAYBE".'],
    ['5.', 'Decisions made by the software are binding only on Fridays.'],
    ['6.', 'The horoscope is licensed separately, by the stars.'],
    ['7.', 'Cloud customers: see section 2 of section 1.'],
  ]
  const notes = [
    { text: '??', x: 300, y: 196, r: 6, at: 2400 },
    { text: 'is this a yes?', x: 236, y: 292, r: -4, at: 3900 },
    { text: 'ask BAdecision', x: 60, y: 470, r: 3, at: 5400 },
  ]

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('.doc'), { opacity: [0, 1], y: [20, 0], rotate: [-2, -1], duration: 700 }, T.doc)
        tl.add(one('.calendar'), { opacity: [0, 1], y: [-10, 0], duration: 500 }, T.weeks - 300)
        all('.mark').forEach((el, i) => tl.add(el, { width: [0, +el.dataset.w], duration: 500, ease: 'inOutSine' }, 1300 + i * 750))
        tl.add(createDrawable(all('.pen'), 0, 0), { draw: '0 1', duration: 600, ease: 'inOutSine', delay: stagger(1800) }, 2000)
        all('.note').forEach((el, i) => tl.add(el, { opacity: [0, 1], scale: [1.3, 1], duration: 300, ease: 'outBack(2)' }, notes[i].at))
        tl.add(one('.coffee'), { opacity: [0, 0.55], scale: [0.9, 1], duration: 900 }, 4600)
        all('.page').forEach((el, i) => tl.add(el, { rotateX: [0, -110], opacity: [1, 0], duration: 360, ease: 'inQuad' }, T.weeks + 900 + i * 1000))
        // the stamp
        tl.add(one('.stamp'), { opacity: [0, 1], scale: [2.6, 1], duration: 260, ease: 'inQuad' }, T.stamp)
        tl.add(one('.doc'), { y: [{ to: 6, duration: 60 }, { to: -2, duration: 80 }, { to: 0, duration: 120 }], scale: [{ to: 0.985, duration: 60 }, { to: 1, duration: 200 }] }, T.stamp + 260)
        tl.add(all('.ink'), { opacity: [0.8, 0.5], scale: [0, 1], duration: 300, delay: stagger(20) }, T.stamp + 250)
        tl.add(all('.caption p'), { opacity: [0, 1], y: [12, 0], duration: 800, delay: stagger(1300) }, T.caption)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="legal" class:ready bind:this={root}>
  <article class="doc">
    <h3>LICENSE</h3>
    <p class="sub">MIT AND UNLICENSED · v2.0.1</p>
    {#each sections as [n, text], i}
      <p class="sec"><b>Section {n}</b> {text}{#if i < 5}<i class="mark" data-w={[150, 220, 120, 260, 180][i]} style:top="{i % 2 ? 22 : 4}px"></i>{/if}</p>
    {/each}
    {#each Array(5) as _, i}<i class="filler" style:width="{60 + hash(i) * 35}%"></i>{/each}
    <svg class="pens" viewBox="0 0 400 520" width="400" height="520">
      <ellipse class="pen" cx="190" cy="168" rx="120" ry="18" fill="none" stroke="#d93030" stroke-width="2.5" transform="rotate(-2 190 168)" />
      <path class="pen" d="M 30 330 C 120 340, 260 320, 370 334" fill="none" stroke="#d93030" stroke-width="2.5" />
      <path class="pen" d="M 300 410 l 30 -30 m -30 0 l 30 30" fill="none" stroke="#d93030" stroke-width="3" />
    </svg>
    <i class="coffee"></i>
    {#each notes as n}<span class="note" style:left="{n.x}px" style:top="{n.y}px" style:rotate="{n.r}deg">{n.text}</span>{/each}
    <div class="stamp">MAYBE<small>LEGAL DEPT · REVIEWED</small></div>
    {#each Array(9) as _, i}<i class="ink" style:left="{150 + hash(i * 3) * 200}px" style:top="{230 + hash(i * 5) * 110}px" style:width="{3 + hash(i) * 6}px" style:height="{3 + hash(i) * 6}px"></i>{/each}
  </article>

  <div class="calendar">
    <small>Review</small>
    <div class="pages">
      <b>Week {week}</b>
      {#each Array(5) as _, i}<span class="page" style:z-index={10 - i}>Week {i + 1}</span>{/each}
    </div>
  </div>

  <div class="caption"><p>Legal reviewed the license for six weeks.</p><p>They returned a single word.</p></div>
</div>

<style>
  .legal { position: relative; width: 800px; height: 600px; overflow: hidden; background: radial-gradient(560px 420px at 30% 50%, #1a1814, #08080a); font-family: var(--sans); }
  .legal:not(.ready) > * { visibility: hidden; }
  .legal > * { position: absolute; }
  .doc { left: 60px; top: 40px; width: 400px; height: 520px; padding: 34px 32px; border-radius: 4px; background: #f4f0e6; color: #2b2925; box-shadow: 0 30px 70px rgba(0, 0, 0, 0.6); opacity: 0; }
  .doc h3 { color: #1b1a17; font: 700 24px var(--serif); letter-spacing: 0.08em; }
  .sub { margin: 2px 0 18px; font: 11px var(--mono); color: #77716a; }
  .sec { position: relative; margin-bottom: 12px; font: 13px/1.55 var(--serif); }
  .sec b { font-weight: 700; }
  .mark { position: absolute; left: 0; height: 18px; width: 0; background: rgba(250, 224, 30, 0.55); mix-blend-mode: multiply; }
  .filler { display: block; height: 7px; margin: 10px 0; border-radius: 3px; background: #ddd7ca; }
  .pens { position: absolute; left: 0; top: 0; pointer-events: none; }
  .coffee { position: absolute; left: 230px; top: 380px; width: 110px; height: 110px; border-radius: 50%; border: 7px solid rgba(120, 72, 30, 0.45); box-shadow: inset 0 0 12px rgba(120, 72, 30, 0.3); opacity: 0; }
  .note { position: absolute; padding: 2px 6px; font: italic 600 18px var(--serif); color: #d93030; white-space: nowrap; opacity: 0; }
  .stamp { position: absolute; left: 70px; top: 220px; padding: 10px 26px 8px; display: flex; flex-direction: column; align-items: center; border: 6px solid #c81e1e; border-radius: 12px; color: #c81e1e; font: 800 76px/1 var(--sans); letter-spacing: 0.06em; rotate: -12deg; mix-blend-mode: multiply; opacity: 0; }
  .stamp small { margin-top: 2px; font: 700 12px var(--mono); letter-spacing: 0.2em; }
  .ink { position: absolute; border-radius: 50%; background: #c81e1e; opacity: 0; }

  .calendar { left: 520px; top: 60px; width: 150px; text-align: center; opacity: 0; }
  .calendar small { display: block; padding: 6px; border-radius: 8px 8px 0 0; background: #c81e1e; color: #fff; font: 600 12px var(--sans); letter-spacing: 0.1em; text-transform: uppercase; }
  .pages { position: relative; height: 90px; perspective: 400px; }
  .pages b, .page { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 0 0 8px 8px; background: #f4f0e6; color: #1b1a17; font: 700 26px var(--sans); transform-origin: top center; }
  .caption { left: 510px; top: 290px; width: 260px; display: flex; flex-direction: column; gap: 14px; }
  .caption p { font: 600 28px/1.15 var(--sans); letter-spacing: -0.03em; color: var(--ink); opacity: 0; }
  .caption p + p { color: #ff8a8a; }
</style>
