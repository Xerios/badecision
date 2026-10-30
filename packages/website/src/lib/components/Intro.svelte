<!-- Eyebrow (dim text), heading, lede paragraphs, an optional check list and a fine-print note. Extra content goes in children. -->
<script>
  import Icon from './Icon.svelte'
  import { rich } from '#lib/text.js'

  let { id, eyebrow, title, text = [], list = [], note, small = false, center = false, children } = $props()
</script>

<div style:align-items={center ? 'center' : null} style:text-align={center ? 'center' : null} style:max-width={center || small ? 'none' : null}>
  {#if eyebrow}<span>{eyebrow}</span>{/if}
  <h2 {id} style:font-size={small ? 'clamp(28px, 3.4vw, 38px)' : null}>{@html rich(title)}</h2>
  {#each [text].flat() as p}<p>{@html rich(p)}</p>{/each}
  {#if list.length}
    <ul>
      {#each list as item}<li><Icon name="check" size={20} stroke={2} /><span>{@html rich(item)}</span></li>{/each}
    </ul>
  {/if}
  {#if note}<small>{@html rich(note)}</small>{/if}
  {@render children?.()}
</div>

<style>
  div { display: flex; flex-direction: column; gap: 18px; align-items: flex-start; max-width: 700px; min-width: 0; }
  div > span { font-size: 14px; font-weight: 500; color: var(--muted); }
  p { font-size: 17px; }
  ul { display: flex; flex-direction: column; gap: 8px; font-size: 15.5px; color: var(--ink-2); }
  li { display: flex; gap: 10px; }
  li :global(svg) { flex: none; margin-top: 3px; color: var(--accent); }
  small { font-size: 15px; color: var(--muted); }
</style>
