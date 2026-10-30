<!-- The live demo: badecision's decide(), seriously.decide() and configure({ sign }) (src/lib/badecision.js), in the browser. -->
<script>
  import { onMount } from 'svelte'
  import { SIGNS } from '@badecision/core/horoscope'
  import Window from './Window.svelte'
  import { highlight, highlightJson } from '#lib/text.js'
  import { loadBadecision } from '#lib/badecision.js'

  const QUESTION = 'Should I deploy on Friday?'
  const MAX = 120 // characters; the model only needs a question, not a novel
  const DEBOUNCE = 300 // ms after the last keystroke before the serious model is asked
  const quote = s => `'${s.replace(/['\\]/g, '\\$&')}'`
  const mb = n => (n / 1e6).toFixed(0)
  // probabilities to two decimals, as in the README
  const show = d => JSON.stringify(d, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? +v.toFixed(2) : v), 2)

  let bd = $state.raw(null)
  let error = $state('')
  let q = $state(QUESTION)
  let sign = $state('') // '' = the session's random sign
  let nerdy = $state(false)
  let serious = $state(false)
  // decided on every keystroke: trimmed, whitespace collapsed, capped at MAX
  const asked = $derived(q.replace(/\s+/g, ' ').trim().slice(0, MAX) || 'nothing')

  // the serious model: idle → loading → ready, or error (retryable)
  let status = $state('idle')
  let progress = $state({ done: 0, total: 0 })
  let loadError = $state('')
  let seriousOut = $state({ ms: '…', json: '' })
  let thinking = $state(false)
  const ready = $derived(serious && status === 'ready')

  onMount(() => {
    loadBadecision().then(
      b => (bd = b),
      e => (error = e.message),
    )
  })

  function download() {
    status = 'loading'
    loadError = ''
    bd.seriously.load((done, total) => (progress = { done, total })).then(
      () => (status = 'ready'),
      e => {
        status = 'error'
        loadError = e.message
      },
    )
  }

  const code = $derived(
    highlight(
      `import { ${sign ? 'configure, ' : ''}${serious ? 'seriously' : 'decide'} } from 'badecision';\n\n` +
        (sign ? `configure({ sign: ${quote(sign)} });\n` : '// no sign configured: one is picked at random per session\n') +
        `${serious ? 'await seriously.' : ''}decide(${quote(asked)}${nerdy ? ', true' : ''});`,
    ),
  )

  const out = $derived.by(() => {
    if (!bd) return { ms: '…', json: error ? `// could not load the model: ${error}` : '// waking the model…' }
    if (ready) return seriousOut
    bd.configure({ sign: sign || null })
    const t0 = performance.now()
    const d = bd.decide(asked, nerdy)
    return { ms: (performance.now() - t0).toFixed(2), json: show(d) }
  })

  // ~0.3 s of WebAssembly on this thread per answer: wait until typing pauses, and drop answers to stale questions
  $effect(() => {
    if (!ready) return
    const [question, n, s] = [asked, nerdy, sign]
    let stale = false
    thinking = true
    const timer = setTimeout(async () => {
      bd.configure({ sign: s || null })
      const t0 = performance.now()
      let next
      try {
        const json = show(await bd.seriously.decide(question, n))
        next = { ms: (performance.now() - t0).toFixed(0), json }
      } catch (e) {
        next = { ms: '…', json: `// ${e.message}` }
      }
      if (stale) return
      seriousOut = next
      thinking = false
    }, DEBOUNCE)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  })
</script>

<Window title="playground.js" aside={ready ? 'engine: serious · SmolLM2-360M' : 'engine: js · no network'} tone="live" dots>
  <div>
    <form onsubmit={e => e.preventDefault()}>
      <pre>{@html code}</pre>
      <label for="ask-q">question</label>
      <input id="ask-q" bind:value={q} maxlength={MAX} autocomplete="off" spellcheck="false" />
      <p>
        <label for="ask-sign">sign</label>
        <select id="ask-sign" bind:value={sign}>
          <option value="">Random (this session)</option>
          {#each SIGNS as [name, glyph]}<option value={name}>{glyph} {name}</option>{/each}
        </select>
      </p>
      <p>
        <label><input type="checkbox" bind:checked={nerdy} />Nerdy mode</label>
        <label><input type="checkbox" bind:checked={serious} disabled={!bd} /><code>seriously</code></label>
      </p>
      <small>
        {#if serious}
          Async. A frozen SmolLM2-360M reads the question in your browser, ~0.3 s per answer, once you stop typing.
        {:else}
          Decides as you type. Synchronous: no await, no loading state, no spinner. Same question, same sign, same day: same answer.
        {/if}
      </small>
    </form>
    <output for="ask-q">
      {#if serious && !ready}
        <section aria-live="polite">
          {#if status === 'loading'}
            <span>downloading the serious model</span>
            <progress max={progress.total || 1} value={progress.done}></progress>
            <small>{progress.total ? `${mb(progress.done)} / ${mb(progress.total)} MB` : 'Reading the model header…'}</small>
          {:else}
            <span>heads up</span>
            <p>
              <code>seriously</code> needs a real language model: the first 20 layers of SmolLM2-360M, about <b>163 MB</b> from Hugging Face. It is downloaded
              once and cached in this browser.
            </p>
            {#if loadError}<small role="alert">Download failed: {loadError}</small>{/if}
            <button type="button" onclick={download}>{loadError ? 'Retry' : 'Download'} 163 MB</button>
          {/if}
        </section>
      {:else}
        <span>response · {thinking ? 'thinking…' : `${out.ms} ms`}</span>
        <pre style:opacity={thinking ? 0.5 : null}>{@html highlightJson(out.json)}</pre>
      {/if}
    </output>
  </div>
</Window>

<style>
  div { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); }
  form, output { padding: 24px; min-width: 0; }
  form { display: flex; flex-direction: column; gap: 16px; border-right: 1px solid var(--line); }
  output { display: block; background: var(--bg-alt); }
  label[for], output span { font-family: var(--mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
  output span { display: block; margin-bottom: 12px; }
  p { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px; }
  input:not([type]), select { min-width: 0; min-height: 44px; padding: 10px 12px; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; background: var(--bg); color: var(--ink); font: inherit; font-size: 15px; }
  select { flex: 0 1 220px; }
  label:not([for]) { display: inline-flex; align-items: center; gap: 10px; min-height: 32px; font-size: 14px; cursor: pointer; }
  label code { color: var(--ink-2); }
  [type='checkbox'] { width: 18px; height: 18px; margin: 0; accent-color: var(--accent); }
  small { font-size: 13px; color: var(--muted); }
  pre { transition: opacity 0.15s; }

  section { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
  section span { margin: 0; color: #fcd34d; }
  section p { display: block; font-size: 14.5px; color: var(--soft); }
  section b { color: var(--ink); font-weight: 500; }
  [role='alert'] { color: #ffa198; }
  progress { width: 100%; height: 8px; border: 0; border-radius: 999px; overflow: hidden; background: var(--grey); appearance: none; }
  progress::-webkit-progress-bar { background: var(--grey); }
  progress::-webkit-progress-value { background: var(--accent); transition: width 0.2s; }
  progress::-moz-progress-bar { background: var(--accent); }
  button { min-height: 40px; padding: 8px 16px; border: 0; border-radius: 8px; background: var(--accent); color: var(--bg); font-weight: 600; font-size: 14px; cursor: pointer; }
</style>
