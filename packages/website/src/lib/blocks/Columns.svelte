<!-- Responsive columns: as many as fit at `min` width each, stacking on small screens. -->
<script>
  let { min = '440px', gap = '56px', align = 'center', tag = 'div', children } = $props()
</script>

<svelte:element this={tag} style:--min={min} style:gap style:align-items={align}>
  {@render children()}
</svelte:element>

<style>
  * { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--min)), 1fr)); }
</style>
