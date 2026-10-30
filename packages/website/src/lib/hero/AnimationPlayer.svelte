<!--
  The animation player: a variant's stage (800×600 unless it declares a `size`) scaled to fit. Without autoplay it shows
  the variant's last frame, darkened, behind a big play button. Once a variant has played through, hovering shows a big
  Replay in the middle. Variants play once and hold their last frame (or loop, if they say so); with reduced motion
  they show a still frame and there is nothing to play. The stage takes no pointer input, selection or context menu.
-->
<script>
  import { heroes } from './index.js'

  /** variant: a key of `heroes`. controls: show the variant picker (when there is more than one). autoplay: start at once. */
  let { variant = 'cosmos', controls = true, autoplay = false } = $props()

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  // ?hero=<key> picks a variant, for previewing and sharing
  const fromUrl = new URLSearchParams(location.search).get('hero')
  let picked = $state(fromUrl in heroes ? fromUrl : null)
  let run = $state(0)
  let playing = $state(autoplay && !reduced)
  let ended = $state(false)
  let width = $state(800)
  const name = $derived(picked ?? variant)
  const hero = $derived(heroes[name])
  const size = $derived(hero.size ?? [800, 600])

  // Replay becomes available a moment after the last frame
  let timer
  function finish() {
    clearTimeout(timer)
    timer = setTimeout(() => (ended = true), 700)
  }
  function start(next = name) {
    clearTimeout(timer)
    picked = next
    ended = false
    playing = !reduced
    run++
  }
  $effect(() => () => clearTimeout(timer))
</script>

<div class="player" class:bare={hero.bare} class:ended style:max-width="{size[0]}px" oncontextmenu={e => e.preventDefault()} role="presentation">
  <div class="frame" role="img" aria-label={hero.description} bind:clientWidth={width} style:aspect-ratio="{size[0]} / {size[1]}">
    <div class="stage" style:width="{size[0]}px" style:height="{size[1]}px" style:scale={width / size[0]}>
      {#key run}<hero.component still={reduced || !playing} onend={() => playing && finish()} />{/key}
    </div>
  </div>
  {#if !playing && !reduced}
    <button class="cover" type="button" aria-label="Play the animation" onclick={() => start()}>
      <span class="disc"><svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" /></svg></span>
    </button>
  {:else}
    <button class="again" type="button" tabindex={ended ? 0 : -1} aria-hidden={!ended} onclick={() => start()}>
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

  .cover, .again { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 0; border: 0; border-radius: 20px; color: var(--ink); cursor: pointer; }
  .disc { width: 84px; height: 84px; display: grid; place-items: center; border-radius: 50%; transition: scale 0.2s cubic-bezier(0.2, 0, 0, 1), background 0.2s; }
  .cover { background: rgba(4, 5, 7, 0.62); }
  .cover .disc { padding-left: 4px; background: rgba(247, 248, 248, 0.92); color: #0b0c0e; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); }
  .cover:hover .disc, .cover:focus-visible .disc { scale: 1.06; background: #fff; }
  /* Replay: in quickly on hover once the animation has ended, out slowly and late */
  .again { background: rgba(4, 5, 7, 0.5); opacity: 0; pointer-events: none; transition: opacity 1.4s ease 0.9s; }
  .ended:hover .again, .ended .again:focus-visible { opacity: 1; pointer-events: auto; transition: opacity 0.3s ease; }
  .again .disc { border: 1.5px solid rgba(255, 255, 255, 0.35); background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(6px); }
  .again:hover .disc { scale: 1.06; background: rgba(255, 255, 255, 0.16); }
  .again b { font: 500 15px var(--sans); letter-spacing: 0.01em; color: var(--ink); text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6); }

  .controls { position: absolute; z-index: 1; right: 14px; bottom: 14px; display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; }
  .player:hover .controls, .controls:focus-within { opacity: 1; }
  select { min-height: 32px; padding: 4px 12px; border: 1px solid var(--edge-strong); border-radius: 8px; background: rgba(15, 16, 17, 0.85); color: var(--soft); font: 12px var(--mono); cursor: pointer; }
  select:hover { color: var(--ink); }
</style>
