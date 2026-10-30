<!-- Label / value rows. Row fields: label (also the key), value (both rich text), ok (green), muted (italic), badge, id.
     Rows slide in and out when the list changes.
     Without labelWidth: label left, value right. With it: a fixed label column. columns: min width to flow into columns. -->
<script>
  import { slide } from 'svelte/transition'
  import { rich } from '#lib/text.js'

  let { rows, labelWidth, columns, pad = '14px 20px', lines = true } = $props()
</script>

<dl style:grid-template-columns={columns ? `repeat(auto-fit, minmax(min(100%, ${columns}), 1fr))` : null}>
  {#each rows as r (r.label)}
    <div
      transition:slide={{ duration: 200 }}
      id={r.id}
      style:padding={pad}
      style:border-color={lines ? null : 'transparent'}
      style:grid-template-columns={labelWidth ? `minmax(0, ${labelWidth}) minmax(0, 1fr)` : null}
      style:display={labelWidth ? 'grid' : null}>
      <dt data-strong={labelWidth || null}>{@html rich(r.label)}</dt>
      <dd data-ok={r.ok || null} data-muted={r.muted || null} data-plain={labelWidth || null}>
        {#if r.badge}<mark>{r.badge}</mark>{/if}{@html rich(r.value)}
      </dd>
    </div>
  {/each}
</dl>

<style>
  dl { display: grid; }
  div { display: flex; justify-content: space-between; gap: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
  div:last-child { border-bottom-color: transparent; }
  dd { color: var(--ink); text-align: right; }
  [data-strong] { color: var(--ink); font-weight: 500; font-size: 14px; }
  [data-plain] { color: inherit; text-align: left; }
  [data-ok] { color: var(--ok); }
  [data-muted] { color: var(--muted); font-style: italic; }
  dd :global(code) { color: var(--ink-2); }
  dt :global(code) { font-size: 13px; font-weight: 400; }
  mark { margin-right: 6px; }
</style>
