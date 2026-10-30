<!-- A card with a file-name title bar. tone: 'ok' colours the aside green, 'live' puts a green dot before it. -->
<script>
  let { title, aside, tone, dots = false, children } = $props()
</script>

<div class="card">
  <header>
    {#if dots}<i></i><i></i><i></i>{/if}
    <span>{title}</span>
    {#if aside}<span data-tone={tone}>{aside}</span>{/if}
  </header>
  {@render children()}
</div>

<style>
  header { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--line); font-family: var(--mono); font-size: 12px; color: var(--muted); }
  i { width: 10px; height: 10px; border-radius: 50%; background: var(--grey); }
  i + span { margin-left: 10px; }
  span + span { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; }
  [data-tone='ok'] { color: var(--ok); }
  [data-tone='live']::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--live); }
</style>
