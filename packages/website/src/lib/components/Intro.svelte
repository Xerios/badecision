<!-- Eyebrow pill, heading, lede paragraphs, an optional check list and a fine-print note. Extra content goes in children. -->
<script>
  import Icon from './Icon.svelte'
  import { rich } from '#lib/text.js'

  let { id, icon, eyebrow, title, text = [], list = [], note, small = false, center = false, children } = $props()
</script>

<div style:align-items={center ? 'center' : null} style:text-align={center ? 'center' : null} style:max-width={center || small ? 'none' : null}>
  {#if eyebrow}<span><i><Icon name={icon} /></i>{eyebrow}</span>{/if}
  <h2 {id} style:font-size={small ? 'clamp(28px, 3.4vw, 38px)' : null}>{@html rich(title)}</h2>
  {#each [text].flat() as p}<p>{@html rich(p)}</p>{/each}
  {#if list.length}
    <ul>
      {#each list as item}<li><Icon name="check" size={20} stroke={2} />{@html rich(item)}</li>{/each}
    </ul>
  {/if}
  {#if note}<small>{@html rich(note)}</small>{/if}
  {@render children?.()}
</div>

<style>
  div { display: flex; flex-direction: column; gap: 18px; align-items: flex-start; max-width: 700px; min-width: 0; }
  span { display: inline-flex; align-items: center; gap: 10px; padding: 4px 14px 4px 4px; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 999px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02)); font-size: 13px; font-weight: 500; color: var(--ink-2); }
  i { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
  p { font-size: 17px; }
  ul { display: flex; flex-direction: column; gap: 8px; font-size: 15.5px; color: var(--ink-2); }
  li { display: flex; gap: 10px; }
  li :global(svg) { flex: none; margin-top: 3px; color: var(--accent); }
  small { font-size: 15px; color: var(--muted); }
</style>
