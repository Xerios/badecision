<!--
  The animation player: a variant's stage (800×600 unless it declares a `size`) scaled to fit. The variant mounts, and so
  starts, once 30% of it is on screen (until then the frame is empty); unless it is (nearly) all in view, it plays a
  half-second teaser and pauses until it is. Once it has played through, hovering shows a big Replay in the middle, and
  scrolling it out of view and back (half on screen) plays it again. Variants play once and hold their last frame (or
  loop, if they say so); with reduced motion they show their last frame at once. The stage takes no pointer input,
  selection or context menu.
-->
<script>
  import { heroes } from './index.js'

  /** variant: a key of `heroes`. grow: scale past the stage's own width, as far as the container and 80% of the viewport height allow. */
  let { variant = 'cosmos', grow = false } = $props()

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  let run = $state(0)
  let seen = $state(false)
  let ended = $state(false)
  // set by Replay: the button hides at once instead of fading out
  let replayed = $state(false)
  let frame
  let width = $state(800)
  const hero = $derived(heroes[variant])
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
  function start() {
    clearTimeout(timer)
    ended = false
    run++
  }
  $effect(() => () => clearTimeout(timer))

  // First play: the variant mounts at 30% on screen and plays a half-second teaser; unless the frame is in view by then
  // (95%, or filling the viewport if it's too tall for that), it pauses there until it is. A finished animation that
  // was scrolled fully out of view plays again once half of it is back.
  let away = false
  let inView = false
  let clock // the variant's timeline or loop timer, announced by stage.js
  let shown = false // the first play has been in view, so it is never held again
  let held = false
  let teaser
  function release() {
    shown = true
    clearTimeout(teaser)
    if (held) clock?.resume()
    held = false
  }
  $effect(() => {
    const onClock = e => {
      clock = e.detail
      if (shown || reduced) return
      clearTimeout(teaser)
      teaser = setTimeout(() => {
        if (inView) return release()
        clock.pause()
        held = true
      }, 500)
    }
    frame.addEventListener('herotimeline', onClock)
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) {
          away = ended
          return
        }
        const fills = e.intersectionRect.height >= (e.rootBounds?.height ?? innerHeight) - 1
        inView = e.intersectionRatio >= 0.95 || fills
        if (!seen && (e.intersectionRatio >= 0.3 || fills)) seen = true
        if (inView && !shown) release()
        if (!away || (e.intersectionRatio < 0.5 && !fills)) return
        away = false
        if (!reduced) start()
      },
      { threshold: [0, 0.3, 0.5, 0.75, 0.95, 1] },
    )
    io.observe(frame)
    return () => {
      io.disconnect()
      frame.removeEventListener('herotimeline', onClock)
      clearTimeout(teaser)
    }
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

</style>
