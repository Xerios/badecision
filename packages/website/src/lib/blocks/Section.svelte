<!-- A page band: full-width background, centred content column, optional Intro header (any Intro prop: title, eyebrow, …).
     tone: 'alt' (darker) or 'dots'. -->
<script>
  import Intro from '#lib/components/Intro.svelte'

  let { id, label, tone, line = true, width = '1160px', pad = '96px var(--gutter)', gap = '36px', children, ...intro } = $props()
</script>

<section
  {id}
  aria-label={intro.title ? null : label}
  aria-labelledby={intro.title ? `${id}-h` : null}
  style:background={tone === 'dots' ? 'var(--dots)' : tone === 'alt' ? 'var(--bg-alt)' : null}
  style:border-top={line ? null : 0}>
  <div style:max-width={width} style:padding={pad} style:gap>
    {#if intro.title}<Intro id="{id}-h" {...intro} />{/if}
    {@render children?.()}
  </div>
</section>

<style>
  section { border-top: 1px solid var(--line); }
  div { margin: 0 auto; display: flex; flex-direction: column; }
</style>
