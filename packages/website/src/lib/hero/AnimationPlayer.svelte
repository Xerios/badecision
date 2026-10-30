<!--
  The animation player: a variant's stage (800×600 unless it declares a `size`) scaled to fit. The variant mounts, and so
  starts, once the player has scrolled into view (until then the frame is empty). Once it has played through, hovering
  shows a big Replay in the middle, and scrolling it out of view and back plays it again. Variants play once and hold
  their last frame (or loop, if they say so); with reduced motion they show their last frame at once. The stage takes no pointer input, selection or context menu.
-->
<script>
  import { heroes } from './index.js'

  /** variant: a key of `heroes`. controls: show the variant picker (when there is more than one) and honour ?hero=.
      grow: scale past the stage's own width, as far as the container and 80% of the viewport height allow. */
  let { variant = 'cosmos', controls = false, grow = false } = $props()

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  // ?hero=<key> picks a variant, for previewing and sharing
  const fromUrl = controls ? new URLSearchParams(location.search).get('hero') : null
  let picked = $state(fromUrl in heroes ? fromUrl : null)
  let run = $state(0)
  let seen = $state(false)
  let ended = $state(false)
  // set by Replay: the button hides at once instead of fading out
  let replayed = $state(false)
  let frame
  let width = $state(800)
  const name = $derived(picked ?? variant)
  const hero = $derived(heroes[name])
  const size = $derived(hero.size ?? [800, 600])

  // Replay becomes available a moment after the last frame
  let timer
  function finish() {
    clearTimeout(timer)
    timer = setTimeout(() => {
      ended = true
      replayed = false
    }, 700)
  }
  function start(next = name) {
    clearTimeout(timer)
    picked = next
    ended = false
    run++
  }
  $effect(() => () => clearTimeout(timer))

  // Start once 40% of the frame is on screen (or it fills half the viewport, for frames taller than that). A finished
  // animation that is scrolled fully out of view plays again when it comes back.
  let away = false
  $effect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) {
          away = ended
          return
        }
        if (e.intersectionRatio < 0.4 && e.intersectionRect.height < (e.rootBounds?.height ?? innerHeight) / 2) return
        seen = true
        if (away && !reduced) start()
        away = false
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] },
    )
    io.observe(frame)
    return () => io.disconnect()
  })
</script>

<div class="player" class:bare={hero.bare} class:ended class:replayed style:max-width={grow ? `calc(80vh * ${size[0]} / ${size[1]})` : `${size[0]}px`} oncontextmenu={e => e.preventDefault()} role="presentation">
  <div class="frame" role="img" aria-label={hero.description} bind:this={frame} bind:clientWidth={width} style:aspect-ratio="{size[0]} / {size[1]}">
    <div class="stage" style:width="{size[0]}px" style:height="{size[1]}px" style:scale={width / size[0]}>
      {#if seen || reduced}{#key run}<hero.component still={reduced} onend={() => !reduced && finish()} />{/key}{/if}
    </div>
  </div>
  {#if !reduced}
    <button class="again" type="button" tabindex={ended ? 0 : -1} aria-hidden={!ended} onclick={() => {
        replayed = true
        start()
      }}>
      <span class="disc">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><path d="M3.5 3.5v5h5" /></svg>
      </span>
      <b>Replay</b>
    </button>
  {/if}
  {#if controls && Object.keys(heroes).length > 1}
    <div class="controls">
      <select aria-label="Animation" value={name} onchange={e => start(e.currentTarget.value)}>
        {#each Object.entries(heroes) as [key, h]}<option value={key}>{h.label}</option>{/each}
      </select>
    </div>
  {/if}
</div>

<style>
  .player { position: relative; width: 100%; max-width: 800px; margin: 0 auto; user-select: none; -webkit-user-select: none; }
  .frame { position: relative; overflow: hidden; border: 1px solid var(--edge); border-radius: 20px; background: #07080a; }
  .bare .frame { border: 0; background: none; }
  .stage { position: absolute; top: 0; left: 0; transform-origin: 0 0; pointer-events: none; }

  .again { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 0; border: 0; border-radius: 20px; color: var(--ink); cursor: pointer; }
  .disc { width: 84px; height: 84px; display: grid; place-items: center; border-radius: 50%; transition: scale 0.2s cubic-bezier(0.2, 0, 0, 1), background 0.2s; }
  /* Replay: fades in on hover once the animation has ended, and out as soon as the pointer leaves */
  .again { background: rgba(4, 5, 7, 0.5); opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
  .replayed .again { transition: none; }
  .ended:hover .again, .ended .again:focus-visible { opacity: 1; pointer-events: auto; }
  .again .disc { border: 1.5px solid rgba(255, 255, 255, 0.35); background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(6px); }
  .again:hover .disc { scale: 1.06; background: rgba(255, 255, 255, 0.16); }
  .again b { font: 500 15px var(--sans); letter-spacing: 0.01em; color: var(--ink); text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6); }

  .controls { position: absolute; z-index: 1; right: 14px; bottom: 14px; display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; }
  .player:hover .controls, .controls:focus-within { opacity: 1; }
  select { min-height: 32px; padding: 4px 12px; border: 1px solid var(--edge-strong); border-radius: 8px; background: rgba(15, 16, 17, 0.85); color: var(--soft); font: 12px var(--mono); cursor: pointer; }
  select:hover { color: var(--ink); }
</style>
