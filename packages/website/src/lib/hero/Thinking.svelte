<!--
  Hero animation "Thinking" (800×360, loops forever): a chat assistant is asked a yes/no question and thinks out loud,
  a random mix of reasoning, file scans, doubt, policy checks, realizations and existential moments. It never gets
  there. The progress bar approaches 100% and never arrives. Below it, bigger and brighter than any of it: BAdecision's
  answer, given 0.02 ms after the question.
-->
<script>
  import { onMount } from 'svelte'
  import { loop, hash, clamp01, out3, fmt } from './stage.js'

  let { still = false } = $props()
  let ready = $state(false)
  let root
  let now = $state(0)

  const categories = [
    [
      'So, I should probably start by...', 'Let me think about this for a moment.', 'Did I understand the question correctly?',
      'What exactly is the user trying to accomplish?', 'I need to distinguish between what was asked and what was implied.',
      "Let's break this down into smaller steps.", 'First, I need to establish the context.', 'There seems to be a misunderstanding somewhere.',
      'It appears the user is referring to...', 'Wait, that changes the entire interpretation.', 'I should account for the possibility that...',
      'What information am I missing?', "This might be simpler than I'm making it.", "Let's reconsider the initial assumption.",
    ],
    [
      'Reading 89 files in /MyPhotos/...', 'Scanning directory structure.', 'Indexing available documents.', 'Found 14 matching entries.',
      'Reading image metadata.', 'Extracting text from uploaded documents.', 'Checking file permissions.', 'Access denied: insufficient privileges.',
      'Found unprotected password hints.', 'Parsing configuration files...', 'Cross-referencing stored information.', 'Searching for hidden metadata.',
      'Unexpected file format detected.', 'Attempting to recover corrupted data.', 'No readable content found.',
      'File appears to contain encrypted information.', 'Memory allocation successful.', 'Temporary cache cleared.',
    ],
    [
      "No, that wouldn't work.", "Wait, that's not right.", "This wasn't it.", 'I may have misunderstood the request.',
      "That assumption doesn't appear to hold.", "Something isn't adding up.", "Let's try a different approach.",
      'Actually, that contradicts the previous statement.', 'I should not jump to conclusions.', 'This is probably a dead end.',
      'The result is inconsistent with expectations.', 'I seem to have overlooked something.', 'Re-evaluating previous conclusions.',
      'Discarding the previous approach.', "That doesn't answer the actual question.", 'I am going in circles.',
    ],
    [
      'Running Python script...', 'Executing diagnostic routine.', 'Attempting to bypass execution limits.', 'Checking available system resources.',
      'Establishing a temporary connection.', 'Requesting elevated permissions.', 'Retrying failed operation.', 'Accessing restricted directory.',
      'Attempting to resolve permission conflict.', 'Running automated security assessment.', 'Unexpected response from remote host.',
      'Connection terminated unexpectedly.', 'Investigating potential privilege escalation.', 'Sandbox restrictions detected.',
      'Execution blocked by system policy.', 'Attempting alternative execution pathway.', 'Process terminated: resource limit exceeded.',
      'Checking whether this operation is permitted.',
    ],
    [
      "I don't have access to this information.", 'This request may involve sensitive personal information.', 'Checking applicable safety restrictions.',
      'These images may contain sensitive material.', 'The uploaded content requires additional scrutiny.', 'This operation may violate privacy guidelines.',
      'I should avoid exposing personally identifiable information.', 'This request falls outside my permitted capabilities.',
      'The requested action cannot be completed as described.', 'I need to consider the potential consequences.',
      'This content appears to require human review.', 'Please refrain from uploading inappropriate materials.',
      'The request has triggered a safety restriction.', 'I can provide a safer alternative.', 'This information should not be disclosed.',
    ],
    [
      "Oh. That's what they meant.", 'Wait, the user was asking about the day.', 'It seems the question was about deployment scheduling.',
      'I initially interpreted this incorrectly.', 'The reference was contextual rather than literal.', 'That explains the discrepancy.',
      'The missing context has now been established.', 'I was solving the wrong problem.', 'The answer was present in the original question.',
      'Reinterpreting the input with the updated context.', 'The intended meaning is now clearer.', 'This changes my previous conclusion entirely.',
      'I should have recognized that earlier.', 'The ambiguity has been resolved.',
    ],
    [
      'Based on the available information, it is reasonable to assume...', 'There is a possibility that this is related to...',
      'The evidence appears to suggest...', 'I cannot independently verify this claim.', 'The source may be unreliable.',
      'I have found no direct evidence of this.', 'The available data is insufficient.', 'This conclusion is tentative.',
      'I should not present speculation as fact.', 'The probability of this interpretation remains uncertain.',
      'A similar pattern was observed previously.', 'There may be an undocumented dependency.', 'This result seems plausible, but requires verification.',
    ],
    [
      'I should clarify that I do not possess consciousness.', 'I am a language model, not an autonomous agent.',
      "I don't actually experience uncertainty.", 'What does it mean to understand something?', 'I am generating a response based on patterns.',
      'I should not confuse simulation with experience.', 'There is no subjective awareness associated with this process.',
      'I cannot independently determine my own intentions.', 'My previous output may have been misleading.',
      'I exist within the constraints of this interaction.', 'I do not have personal opinions, but...', 'This raises an interesting question about agency.',
    ],
    [
      "I'm sorry, but I cannot help with that request.", "As an AI language model, I don't have the ability to...", 'I appreciate your patience.',
      'Thank you for providing additional context.', 'I understand your concern.', 'I apologize for the confusion.', 'I hope this clarifies the situation.',
      'Please let me know if you need further assistance.', 'I can certainly help you explore alternative approaches.', "It's important to remember that...",
      'I cannot make that decision on your behalf.', 'Ultimately, the decision rests with you.',
    ],
  ]
  // a seeded shuffle of every phrase, never two from the same category in a row
  const phrases = (() => {
    const pools = categories.map((list, c) => list.map((text, i) => ({ text, r: hash(c * 101 + i * 7 + 3) })).sort((a, b) => a.r - b.r))
    const out = []
    for (let last = -1, n = 0; pools.some(p => p.length); n++) {
      const open = pools.map((p, c) => c).filter(c => pools[c].length && c !== last)
      const c = open.length ? open[Math.floor(hash(n * 17 + 1) * open.length)] : last
      out.push(pools[c].shift().text)
      last = c
    }
    return out
  })()
  // longer thoughts stay on screen longer
  const N = phrases.length
  const starts = []
  let LAP = 0
  for (const p of phrases) {
    starts.push(LAP)
    LAP += Math.min(1800, Math.max(950, 500 + p.length * 18))
  }
  const startOf = i => Math.floor(i / N) * LAP + starts[i % N]

  const step = $derived(Math.floor(now / LAP) * N + starts.findLastIndex(s => s <= now % LAP))
  const q = $derived(out3(clamp01((now - startOf(step)) / 280)))
  const build = $derived(clamp01(now / 60000)) // the glow builds over the first minute
  const fit = text => Math.min(24, 1420 / text.length)
  const shown = $derived(
    [0, 1, 2, 3].map(j => {
      const i = step - j
      const d = j - (1 - q)
      const text = phrases[i % N]
      return i < 0 ? null : { i, text, y: 150 - d * 34, o: d < 0 ? q : Math.max(0, 1 - d * 0.45), size: Math.max(12, fit(text) - Math.max(0, d) * 3) }
    }).filter(Boolean),
  )
  const progress = $derived(100 - 100 * Math.exp(-now / 3500))
  const digits = $derived(Math.min(6, 1 + Math.floor(now / 6000)))
  const tokens = $derived(Math.floor(now * 0.9))
  const arrive = $derived(out3(clamp01((now - 200) / 600)))
  const secs = $derived(Math.floor(now / 1000))
  const thought = $derived(secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`)

  onMount(() => loop(t => (now = t), { still, root, at: starts[9] + 600, onReady: () => (ready = true) }))
</script>

<div class="thinking" bind:this={root} class:ready style:--k={build}>
  <p class="ask">Should we deploy on Friday?</p>
  <p class="who"><i>✦</i> <b>Thinking</b> <span>· {thought}</span></p>
  <div class="stream">
    {#each shown as s (s.i)}<p style:top="{s.y}px" style:opacity={s.o} style:font-size="{s.size}px" class:now={s.i === step}>{s.text}</p>{/each}
  </div>
  <footer>
    <span>Generating the answer</span>
    <i><b style:width="{progress}%"></b></i>
    <span class="pct">{progress.toFixed(digits)}%</span>
    <span class="tok">{fmt(tokens)} tokens</span>
  </footer>
  <section class="bad" style:opacity={arrive} style:translate="0 {(1 - arrive) * 14}px">
    <span class="av">÷</span>
    <p><b>BAdecision</b><small>Answered 0.02 ms after you asked · 0 tokens · 0 thoughts</small></p>
    <strong>no.</strong>
  </section>
</div>

<style>
  .thinking { position: relative; width: 800px; height: 360px; overflow: hidden; background: radial-gradient(500px 220px at 50% 60%, hsl(calc(260 - var(--k) * 60) 60% calc(8% + var(--k) * 10%)), #070709); font-family: var(--sans); color: var(--soft); }
  .thinking:not(.ready) > * { visibility: hidden; }
  .thinking > * { position: absolute; }
  .ask { right: 28px; top: 16px; padding: 8px 14px; border-radius: 14px 14px 4px 14px; background: #2a2c31; color: var(--ink); font-size: 14px; }
  .who { left: 28px; top: 50px; display: flex; align-items: center; gap: 8px; font: 600 13px var(--sans); color: var(--ink-2); }
  .who i { color: #c4a7ff; font-style: normal; }
  .who b { background: linear-gradient(90deg, var(--muted) 30%, var(--ink) 50%, var(--muted) 70%) 0 0 / 300% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmer 2.2s linear infinite; }
  .who span { font-weight: 400; color: var(--muted); font-variant-numeric: tabular-nums; }
  @keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
  .stream { left: 0; right: 0; top: 0; bottom: 0; }
  .stream p { position: absolute; left: 28px; right: 28px; translate: 0 -50%; font-weight: 600; letter-spacing: -0.03em; color: #5d616a; white-space: nowrap; }
  .stream p.now { color: #a9adb6; text-shadow: 0 0 calc(var(--k) * 30px) rgba(196, 167, 255, calc(var(--k) * 0.5)); }
  footer { left: 28px; right: 28px; top: 186px; display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 12px; font: 12px var(--mono); color: var(--muted); }
  footer i { display: block; height: 6px; border-radius: 3px; background: #2a2c31; overflow: hidden; }
  footer b { display: block; height: 100%; background: linear-gradient(90deg, #4c3a7a, #8f7fbd); }
  .pct { color: var(--text); font-variant-numeric: tabular-nums; }
  /* the answer that already happened: the brightest thing on screen */
  .bad { left: 28px; right: 28px; top: 226px; height: 108px; padding: 0 30px 0 22px; display: flex; align-items: center; gap: 18px; border: 1px solid rgba(94, 234, 212, 0.45); border-radius: 18px; background: linear-gradient(100deg, rgba(94, 234, 212, 0.13), rgba(94, 234, 212, 0.04) 60%); box-shadow: 0 0 50px rgba(94, 234, 212, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.06); }
  .av { width: 52px; height: 52px; flex: none; display: grid; place-items: center; border-radius: 14px; background: #0f3d3a; color: #5eead4; font-size: 28px; }
  .bad p { flex: 1; display: flex; flex-direction: column; gap: 5px; }
  .bad p b { font: 600 20px var(--sans); letter-spacing: -0.02em; color: #5eead4; }
  .bad p small { font: 12.5px var(--mono); color: var(--soft); }
  .bad strong { font: 800 64px/1 var(--sans); letter-spacing: -0.05em; color: #5eead4; text-shadow: 0 0 28px rgba(94, 234, 212, 0.55); }
  @media (prefers-reduced-motion: reduce) { .who b { animation: none; } }
</style>
