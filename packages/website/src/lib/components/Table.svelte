<!-- A captioned, horizontally scrollable table. rows: arrays of cells; the first cell is the row header when rowHeaders is set.
     highlight: the column index to emphasise (ours). -->
<script>
  let { caption, columns, rows, highlight = -1, rowHeaders = false, mono = false, minWidth = '520px' } = $props()
</script>

<div>
  <table style:min-width={minWidth}>
    <caption>{caption}</caption>
    <thead>
      <tr>
        {#each columns as c, i}<th scope="col" data-ours={i === highlight || null}>{c}</th>{/each}
      </tr>
    </thead>
    <tbody style:font-family={mono ? 'var(--mono)' : null} style:font-size={mono ? '13px' : null}>
      {#each rows as row}
        <tr>
          {#each row as cell, i}
            {#if i === 0 && rowHeaders}<th scope="row">{cell}</th>{:else}<td data-ours={i === highlight || null}>{cell}</td>{/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  div { border: 1px solid var(--edge); border-radius: 12px; overflow-x: auto; }
  table { font-size: 14px; }
  caption { text-align: left; padding: 18px 20px 6px; color: var(--ink); font-weight: 500; }
  th, td { padding: 12px 20px; text-align: left; font-weight: 400; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
  thead th { color: var(--muted); font-size: 13px; border-color: var(--line); }
  tr:last-child > * { border-bottom: 0; }
  [data-ours] { color: var(--ink); }
  thead [data-ours] { font-weight: 500; }
</style>
