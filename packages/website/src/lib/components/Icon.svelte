<script>
  import { ICONS } from '#lib/icons.js'
  let { name, size = 13, stroke = 2.2 } = $props()
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#each ICONS[name] as d}<path {d} />{/each}
</svg>
