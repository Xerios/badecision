<!-- The live demo: the real tiny model from @badecision/core, in the browser. -->
<script>
  import { onMount } from 'svelte'
  import { createDecider } from '@badecision/core'
  import { SIGNS } from '@badecision/core/horoscope'
  import Window from './Window.svelte'
  import { highlight } from '#lib/text.js'

  const QUESTION = 'Should I deploy on Friday?'
  const ANSWERS = { yes: 'Yes.', no: 'No.', maybe: 'Maybe.', unsure: 'Not sure.' }
  const CODE = highlight(`import { decide } from 'badecision';\n\ndecide(question, nerdy);`)
  const [name, glyph, element] = SIGNS[Math.floor(Math.random() * SIGNS.length)]
  const round = p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, +v.toFixed(2)]))

  let decider = $state.raw(null)
  let error = $state('')
  let q = $state(QUESTION)
  let asked = $state(QUESTION)
  let nerdy = $state(false)

  onMount(() => {
    createDecider().then(
      d => (decider = d),
      e => (error = e.message),
    )
  })

  const out = $derived.by(() => {
    if (!decider) return { ms: '…', json: error ? `// could not load the model: ${error}` : '// waking the model…' }
    const t0 = performance.now()
    const r = decider.decide(asked.trim() || 'nothing', { sign: name })
    const ms = (performance.now() - t0).toFixed(2)
    const d = { question: r.text, verdict: r.verdict, answer: ANSWERS[r.verdict], confidence: +r.confidence.toFixed(2) }
    if (nerdy)
      Object.assign(d, {
        probs: round(r.probs),
        model: round(r.model),
        sign: { name, glyph, element, source: 'random' },
        date: r.stars.date,
        oppositeDay: r.oppositeDay,
        starsChangedIt: r.starsChangedIt,
        omenHits: r.omenHits.map(o => o.text),
        notes: r.stars.notes,
        engine: 'js',
      })
    return { ms, json: JSON.stringify(d, null, 2) }
  })
</script>

<Window title="playground.js" aside="engine: js · no network" tone="live" dots>
  <div>
    <form
      onsubmit={e => {
        e.preventDefault()
        asked = q
      }}>
      <pre>{@html CODE}</pre>
      <label for="ask-q">question</label>
      <p>
        <input id="ask-q" bind:value={q} autocomplete="off" />
        <button>Decide</button>
      </p>
      <label><input type="checkbox" bind:checked={nerdy} />Nerdy mode</label>
      <small>Synchronous. No await, no loading state, no spinner. Your sign was picked at random for this session.</small>
    </form>
    <output for="ask-q">
      <span>response · {out.ms} ms</span>
      <pre>{out.json}</pre>
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
  p { display: flex; flex-wrap: wrap; gap: 8px; }
  input:not([type]) { flex: 1 1 220px; min-width: 0; min-height: 44px; padding: 10px 12px; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; background: var(--bg); color: var(--ink); font-size: 15px; }
  button { min-height: 44px; padding: 10px 18px; border: 0; border-radius: 8px; background: var(--accent); color: var(--bg); font-weight: 600; font-size: 14px; cursor: pointer; }
  label:not([for]) { display: inline-flex; align-items: center; gap: 10px; min-height: 32px; font-size: 14px; cursor: pointer; }
  [type='checkbox'] { width: 18px; height: 18px; margin: 0; accent-color: var(--accent); }
  small { font-size: 13px; color: var(--muted); }
</style>
