<!-- An Intro beside a visual (children). flip puts the visual first; `more` renders extra content under the intro. -->
<script>
  import Columns from './Columns.svelte'
  import Intro from '#lib/components/Intro.svelte'

  let { flip = false, min, gap, align, more, children, ...intro } = $props()
</script>

<Columns {min} {gap} {align}>
  {#if flip}{@render children()}{/if}
  <Intro {...intro}>{@render more?.()}</Intro>
  {#if !flip}{@render children()}{/if}
</Columns>
