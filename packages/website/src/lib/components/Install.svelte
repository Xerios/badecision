<script>
  let { id, command = 'npm install badecision' } = $props()
  let copied = $state(false)

  function copy() {
    navigator.clipboard?.writeText(command).catch(() => {})
    copied = true
    setTimeout(() => (copied = false), 1600)
  }
</script>

<div {id}>
  <span><span aria-hidden="true">$</span> {command}</span>
  <button type="button" onclick={copy} aria-label="Copy install command">{copied ? 'Copied' : 'Copy'}</button>
</div>

<style>
  div {
    display: flex;
    align-items: center;
    gap: 14px;
    width: fit-content;
    max-width: 100%;
    padding: 6px 6px 6px 16px;
    border: 1px solid var(--edge);
    border-radius: 10px;
    background: var(--panel);
    font-family: var(--mono);
    font-size: 14px;
    color: var(--ink-2);
  }
  span span { color: var(--muted); }
  button { min-height: 36px; padding: 8px 12px; border: 1px solid var(--edge); border-radius: 7px; background: var(--raised); color: var(--soft); font-size: 12px; cursor: pointer; }
  button:hover { color: var(--ink); }
</style>
