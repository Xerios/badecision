<!--
  The hero animation frame: an 800×600 stage scaled to fit, one variant from index.js inside it, and small Replay /
  variant controls. Variants play once and hold their last frame; with reduced motion they show that frame directly.
-->
<script>
  import { heroes } from './index.js'

  /** variant: a key of `heroes`. controls: show Replay (and the variant picker, when there is more than one). */
  let { variant = 'cosmos', controls = true } = $props()

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  // ?hero=<key> picks a variant, for previewing and sharing
  const fromUrl = new URLSearchParams(location.search).get('hero')
  let picked = $state(fromUrl in heroes ? fromUrl : null)
  let run = $state(0)
  let done = $state(false)
  let width = $state(800)
  const name = $derived(picked ?? variant)
  const hero = $derived(heroes[name])

  function play(next = name) {
    picked = next
    done = false
    run++
  }
</script>

<div class="hero-animation">
  <div class="frame" role="img" aria-label={hero.description} bind:clientWidth={width}>
    <div class="stage" style:scale={width / 800}>
      {#key run}<hero.component {still} onend={() => (done = true)} />{/key}
    </div>
  </div>
  {#if controls}
    <div class="controls" class:done>
      {#if Object.keys(heroes).length > 1}
        <select aria-label="Animation" value={name} onchange={e => play(e.currentTarget.value)}>
          {#each Object.entries(heroes) as [key, h]}<option value={key}>{h.label}</option>{/each}
        </select>
      {/if}
      <button type="button" onclick={() => play()}>↻ Replay</button>
    </div>
  {/if}
</div>

<style>
  .hero-animation { position: relative; width: 100%; max-width: 800px; margin: 0 auto; }
  .frame { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border: 1px solid var(--edge); border-radius: 20px; background: #07080a; }
  .stage { position: absolute; top: 0; left: 0; width: 800px; height: 600px; transform-origin: 0 0; }
  .controls { position: absolute; right: 14px; bottom: 14px; display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; }
  .hero-animation:hover .controls, .controls:focus-within, .controls.done { opacity: 1; }
  button, select { min-height: 32px; padding: 4px 12px; border: 1px solid var(--edge-strong); border-radius: 8px; background: rgba(15, 16, 17, 0.85); color: var(--soft); font: 12px var(--mono); cursor: pointer; }
  button:hover, select:hover { color: var(--ink); }
</style>
