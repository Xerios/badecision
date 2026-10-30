<!--
  Hero animation "Building up" (800×240, loops forever, made for the footer): AI-speak phrases rise one at a time like
  embers, each tilted and drifting the way it leans, cooling and fading as it goes. As each one dies, the BAdecision
  logo in the middle stutters on like a broken street light, faintly, then drops back to almost nothing. Quiet on
  purpose: no background, nothing bright.
-->
<script>
  import { onMount } from 'svelte'
  import { loop, hash, clamp01, out3 } from './stage.js'

  let { still = false } = $props()
  let ready = $state(false)
  let root
  let now = $state(0)

  const phrases = [
    "Let's dive in.", "Let's unpack this.", 'Delve into...', "In today's rapidly evolving landscape...", 'At its core...', "It's worth noting that...",
    'Interestingly enough...', 'The reality is...', "Here's where things get interesting.", 'The key takeaway?', 'Let that sink in.', 'This changes everything.',
    'A paradigm shift.', 'Unlock the potential of...', 'Leverage the power of...', 'Seamlessly integrate...', 'Robust and scalable.', 'Cutting-edge technology.',
    'Next-generation solution.', 'Game changer.', 'Revolutionary approach.', 'Supercharge your workflow.', 'Empower developers.', 'Democratize access to...',
    'In an era where...', 'The future is here.', 'Think of it as...', 'The beauty of this approach...', 'What makes this different?', 'This is where AI shines.',
  ]
  const order = phrases.map((p, i) => [hash(i * 9.1 + 4), p]).sort((a, b) => a[0] - b[0]).map(x => x[1])
  const C = 4400 // a new ember every C ms
  const L = 5600 // each one lives L ms, so the next is born while the last one fades
  const LIT = 1800 // the light stutters on over the last LIT ms of each phrase, and a little after
  const RISE = 120

  // where ember k is, `age` ms after it was born
  const pose = (k, age) => {
    const tilt = (hash(k * 3.7 + 1) - 0.5) * 34
    const rad = (tilt * Math.PI) / 180
    const dist = RISE * (1 - (1 - age / L) ** 1.6) // quick off the ground, slowing as it cools
    return { tilt, x: 400 + (hash(k * 5.1 + 3) - 0.5) * 240 + Math.sin(rad) * dist + Math.sin(age / 700 + k) * 5, y: 200 - Math.cos(rad) * dist }
  }
  const embers = $derived.by(() => {
    const out = []
    for (let k = Math.max(0, Math.floor((now - L) / C) + 1); k * C <= now; k++) {
      const age = now - k * C
      const born = out3(clamp01(age / 900))
      const heat = 1 - clamp01(age / 1600)
      const sparks = [1, 2, 3].map(j => ({ ...pose(k, Math.max(0, age - j * 110)), o: heat * (1 - j / 4) }))
      out.push({
        k,
        text: order[k % order.length],
        hue: Math.floor(hash(k * 7.3 + 2) * 360),
        ...pose(k, age),
        scale: 0.25 + 0.75 * born,
        blur: 8 * (1 - born),
        heat,
        o: Math.min(born, 1 - clamp01((age - (L - 1700)) / 1700)) * 0.85,
        sparks,
      })
    }
    return out
  })
  // a broken street light: stutters, catches for a moment, gives up. Never more than a glimmer.
  const light = $derived.by(() => {
    let v = 0
    for (let k = Math.max(0, Math.floor((now - L - 400) / C)); k * C <= now; k++) {
      const t = now - (k * C + L - LIT)
      if (t < 0 || t > LIT + 400) continue
      const q = t / (LIT + 400)
      const on = hash(Math.floor(t / 70) + k * 131) > 0.85 - 0.6 * Math.min(1, q * 1.6) ? 1 : 0.15
      v = Math.max(v, Math.sin(Math.PI * q) * on)
    }
    return v
  })

  onMount(() => loop(t => (now = t), { still, root, at: C + L - 700, onReady: () => (ready = true) }))
</script>

<div class="buildingup" bind:this={root} class:ready aria-hidden="true" style:--l={light}>
  <i class="pool"></i>
  <p class="logo">
    <svg width="34" height="34" viewBox="0 0 22 22">
      <rect x="0.75" y="0.75" width="20.5" height="20.5" rx="5" fill="none" stroke="currentColor" stroke-width="1.5" />
      <path d="M6 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="11" cy="6.5" r="1.4" fill="currentColor" />
      <circle cx="11" cy="15.5" r="1.4" fill="currentColor" />
    </svg>
    BAdecision
  </p>
  {#each embers as e (e.k)}
    {#each e.sparks as s}<i class="spark" style:left="{s.x}px" style:top="{s.y + 14}px" style:opacity={s.o * e.o} style:background="hsl({e.hue} 95% 70%)"></i>{/each}
    <p
      class="ember"
      style:left="{e.x}px"
      style:top="{e.y}px"
      style:opacity={e.o}
      style:transform="translate(-50%, -50%) rotate({e.tilt}deg) scale({e.scale})"
      style:filter="blur({e.blur}px)"
      style:color="hsl({e.hue} 80% {72 + 22 * e.heat}%)"
      style:text-shadow="0 0 {4 + 14 * e.heat}px hsl({e.hue} 90% 60% / {0.25 + 0.6 * e.heat})"
    >
      {e.text}
    </p>
  {/each}
</div>

<style>
  .buildingup { position: relative; width: 800px; height: 240px; overflow: hidden; font-family: var(--sans); }
  .buildingup:not(.ready) > * { visibility: hidden; }
  .buildingup > * { position: absolute; }
  .pool { left: 150px; right: 150px; top: 20px; bottom: 20px; background: radial-gradient(closest-side, rgba(255, 200, 130, 0.09), transparent); opacity: var(--l); }
  .logo { left: 0; right: 0; top: 120px; translate: 0 -50%; display: flex; align-items: center; justify-content: center; gap: 14px; font: 600 40px var(--sans); letter-spacing: -0.04em; color: #f1e6d6; opacity: calc(0.06 + 0.16 * var(--l)); text-shadow: 0 0 calc(var(--l) * 18px) rgba(255, 210, 150, calc(var(--l) * 0.35)); }
  .logo svg { filter: drop-shadow(0 0 calc(var(--l) * 8px) rgba(255, 210, 150, calc(var(--l) * 0.4))); }
  .ember { white-space: nowrap; font: italic 22px var(--serif); letter-spacing: 0.01em; will-change: transform, opacity; }
  .spark { width: 3px; height: 3px; margin: -1.5px; border-radius: 50%; }
</style>
