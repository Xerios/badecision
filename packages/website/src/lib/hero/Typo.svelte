<!--
  Hero animation "Typo": an asciinema-style recording of someone installing BAdecision. Two typos later a typosquat is
  uploading their SSH keys; frantic keystrokes; npx norton-antivirus finds 4,812 threats. Then a mouse cursor leaves the
  canvas and slowly drags a screenshot of a clean install over the whole mess. ~24s.
-->
<script>
  import { onMount } from 'svelte'
  import { play, hash, clamp01, span, io3 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  // keystrokes: '\b' is backspace; each key takes per × (0.55..1.45) ms
  const keyTimes = (keys, start, per) => {
    let t = start
    return [...keys].map((_, i) => (t += per * (0.55 + 0.9 * hash(start + i))))
  }
  const typed = (s, t) => {
    let out = ''
    for (let i = 0; i < s.keys.length && s.times[i] <= t; i++) out = s.keys[i] === '\b' ? out.slice(0, -1) : out + s.keys[i]
    return out
  }

  // the recording, built in order
  const steps = []
  let t = 500
  const cmd = (keys, per = 75, after = 350, prompt = '$ ') => {
    const s = { at: t, prompt, keys, times: keyTimes(keys, t, per) }
    steps.push(s)
    t = s.times.at(-1) + after
  }
  const out = (text, cls = '', after = 90) => {
    steps.push({ at: t, text, cls })
    t += after
  }
  const wait = ms => (t += ms)

  cmd('npm isntall badecision')
  out('Unknown command: "isntall"', 'err')
  out('')
  out('Did you mean this?', 'dim')
  out('    npm install # Install a package', 'dim', 1100)
  cmd('npm install badceis\b\b\b\becsion', 85, 500)
  out('added 1 package in 0.4s')
  out('')
  out('> badecsion@6.6.6 postinstall', 'dim')
  out('> node ./totally-not-a-miner.js', 'dim', 300)
  const UPLOAD = t
  steps.push({ at: t, upload: true })
  t += 120
  const PANIC = UPLOAD + 700
  const keycast = ['Ctrl C', 'Ctrl C', 'Ctrl C', 'Esc', ':q!', 'Ctrl D', 'exit', 'Ctrl Z', 'quit()', '⌘ Q', 'Alt F4', 'please']
  const castAt = keycast.map((_, i) => PANIC + i * 230 - i * i * 6)
  steps.push({ at: PANIC, echo: true })
  const UPLOADED = UPLOAD + 3700
  t = UPLOADED
  out('✓ Upload complete. Thank you for your contribution ♥', 'ok', 1300)
  cmd('npx norton-antivirus scan', 70, 300)
  out('Need to install the following packages:')
  out('  norton-antivirus@24.0.1 (1.2 GB)', 'dim')
  cmd('y', 200, 400, 'Ok to proceed? (y) ')
  const SCAN = t
  steps.push({ at: t, scan: true })
  t += 1500
  const threats = [
    ['THREAT', 'badecsion@6.6.6', 'trojan.npm.typosquat'],
    ['THREAT', '~/.ssh', 'exfiltrated (too late)'],
    ['THREAT', 'node_modules', 'larger than the observable universe'],
    ['THREAT', 'left-pad', 'emotional damage'],
    ['THREAT', 'totally-not-a-miner.js', 'is a miner'],
    ['WARN', 'norton-antivirus', 'is itself 1.2 GB'],
    ['THREAT', 'package-lock.json', '41,233 lines of regret'],
    ['ERROR', 'subscription', 'expired. Renew for $129.99/yr'],
    ['THREAT', 'you', 'typed "badecsion"'],
  ]
  threats.forEach(([k, a, b], i) => out(`✖ ${k.padEnd(7)} ${a.padEnd(24)} ${b}`, 'err', 180 - i * 8))
  for (let i = 0; i < 9; i++) out(`✖ THREAT  node_modules/${['is-odd', 'is-even', 'is-number', 'kind-of', 'pad-left', 'yes', 'no', 'maybe', 'nope'][i]}`.padEnd(42) + 'suspicious', 'err', 55)
  out('✖ 4,812 threats found. 0 removed.', 'err big', 1400)
  const CURSOR = t
  const T = { cursor: CURSOR, out: CURSOR + 900, drag: CURSOR + 1700, drop: CURSOR + 4600, leave: CURSOR + 5200, end: CURSOR + 8200 }

  const LH = 21
  const CAP = 20
  const lines = $derived.by(() => {
    const visible = []
    for (const s of steps) {
      if (s.at > now) break
      if (s.keys) visible.push({ prompt: s.prompt, text: typed(s, now), live: now < s.times.at(-1) + 250 })
      else if (s.upload) {
        const p = span(now, UPLOAD, UPLOADED - UPLOAD - 200, x => x)
        const bar = '▓'.repeat(Math.round(p * 24)).padEnd(24, '░')
        visible.push({ text: `Uploading ~/.ssh/id_ed25519 → 185.243.11.7  ${bar} ${Math.round(p * 100)}%`, cls: 'warn' })
      } else if (s.echo) {
        const n = castAt.filter(a => a <= now).length
        visible.push({ text: '^C^C^C^[:q!^Dexit^Zquit()⌘Q⌥F4please'.slice(0, Math.round((n / keycast.length) * 34)), cls: 'dim' })
      } else if (s.scan) {
        const p = span(now, SCAN, 1300, x => x)
        visible.push({ text: `Scanning node_modules… ${Math.round(p * 1_204_331).toLocaleString('en-US')} files`, cls: 'dim' })
      } else visible.push({ text: s.text, cls: s.cls })
    }
    return visible
  })
  const shift = $derived(Math.max(0, lines.length - CAP) * LH)
  const keys = $derived(keycast.map((k, i) => ({ k, p: span(now, castAt[i], 160), gone: span(now, castAt[i] + 700, 300) })).filter(k => k.p > 0 && k.gone < 1))

  // the cursor: in from the bottom right, out over the right edge, back dragging a screenshot by its title bar
  const shot = $derived.by(() => {
    if (now < T.drag) return null
    const d = io3(clamp01((now - T.drag) / (T.drop - T.drag)))
    const wob = 1 - d
    return { x: 880 - 834 * d + Math.sin(now / 90) * 3 * wob, y: 150 - 100 * d + Math.cos(now / 120) * 3 * wob }
  })
  // the screenshot swings on the cursor's grip like a hanging frame: it lags behind when the drag speeds up, swings
  // forward as it slows, rings out after the drop and stays a little crooked. Integrated from the start of the drag,
  // so it stays seekable.
  const tilt = $derived.by(() => {
    if (now < T.drag) return 0
    const dur = (T.drop - T.drag) / 1000
    const dt = 1 / 60
    let th = 0
    let v = 0
    for (let t = T.drag; t < Math.min(now, T.drop + 2500); t += dt * 1000) {
      const p = clamp01((t - T.drag) / (T.drop - T.drag))
      const acc = p <= 0 || p >= 1 ? 0 : p < 0.5 ? 24 * p : -12 * (2 - 2 * p) // io3''
      const ax = (-834 * acc) / (dur * dur) // px/s², leftwards is negative
      v += (-0.26 * ax - 57 * th - 5.3 * v) * dt
      th += v * dt
    }
    return -1.8 + th
  })
  const cursor = $derived.by(() => {
    if (now < T.cursor) return null
    if (shot) {
      const l = io3(clamp01((now - T.leave) / 1600))
      return { x: shot.x + 70 + 190 * l, y: shot.y + 10 + 150 * l, grab: now < T.drop + 250 }
    }
    const a = io3(clamp01((now - T.cursor) / 800))
    const b = io3(clamp01((now - T.out) / 600))
    return { x: 840 - 300 * a + 420 * b, y: 620 - 240 * a - 90 * b, grab: false }
  })

  onMount(() => play(root, () => T.end, { still, onend, onUpdate: v => (now = v), onReady: () => (ready = true) }))
</script>

<div class="typo" class:ready bind:this={root}>
  <section class="term">
    <header><i></i><i></i><i></i><span>bash — 92×24</span><b>● REC</b></header>
    <div class="screen">
      <div style:transform="translateY({-shift}px)">
        {#each lines as l, i}
          <p class={l.cls}>{#if l.prompt}<span class="prompt">{l.prompt}</span>{/if}{l.text}{#if i === lines.length - 1 && (l.live || Math.floor(now / 500) % 2 === 0)}<i class="caret"></i>{/if}</p>
        {/each}
      </div>
    </div>
    <footer><span>asciinema</span><i style:width="{clamp01(now / T.end) * 100}%"></i></footer>
  </section>

  <div class="keycast">{#each keys as k}<kbd style:opacity={k.p * (1 - k.gone)} style:transform="translateY({(1 - k.p) * 10}px)">{k.k}</kbd>{/each}</div>

  {#if shot}
    <figure class="shot" style:transform="translate({shot.x}px, {shot.y}px) rotate({tilt}deg)">
      <header><i></i><i></i><i></i><span>bash — 92×24</span></header>
      <div>
        <p><span class="prompt">{'$ '}</span>npm install badecision</p>
        <p>added 1 package, and audited 2 packages in 412ms</p>
        <p>found <b>0</b> vulnerabilities</p>
        <p><span class="prompt">{'$ '}</span><i class="caret"></i></p>
      </div>
      <figcaption>Screenshot 2026-10-30 at 16.58.12.png</figcaption>
    </figure>
  {/if}

  {#if cursor}
    <svg class="cursor" width="26" height="30" viewBox="0 0 26 30" style:transform="translate({cursor.x}px, {cursor.y}px)">
      {#if cursor.grab}
        <path d="M7 12 V6 a2 2 0 0 1 4 0 V11 V4 a2 2 0 0 1 4 0 V11 V5 a2 2 0 0 1 4 0 V12 V8 a2 2 0 0 1 4 0 V18 c0 6 -4 9 -9 9 c-5 0 -7 -3 -9 -7 l-3 -6 a2 2 0 0 1 3 -2 z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round" />
      {:else}
        <path d="M2 2 L2 24 L8 18 L12 27 L16 25 L12 17 L20 17 Z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round" />
      {/if}
    </svg>
  {/if}
</div>

<style>
  .typo { position: relative; width: 800px; height: 600px; overflow: hidden; background: #121212; font-family: var(--mono); }
  .typo:not(.ready) > * { visibility: hidden; }
  .typo > * { position: absolute; }
  .term, .shot { border: 1px solid #333; border-radius: 10px; background: #0b0b0c; overflow: hidden; }
  .term { left: 24px; top: 24px; width: 752px; height: 552px; display: flex; flex-direction: column; }
  header { height: 30px; flex: none; padding: 0 12px; display: flex; align-items: center; gap: 7px; background: #1c1c1e; font: 12px var(--sans); color: #8a8f98; }
  header i { width: 11px; height: 11px; border-radius: 50%; background: #ff5f57; }
  header i:nth-child(2) { background: #febc2e; }
  header i:nth-child(3) { background: #28c840; }
  header span { flex: 1; text-align: center; }
  header b { color: #f85149; font-weight: 500; font-size: 11px; }
  .screen { flex: 1; min-height: 0; padding: 12px 16px; overflow: hidden; font-size: 13.5px; line-height: 21px; color: #e6e7e9; }
  .screen p { height: 21px; white-space: pre; overflow: hidden; }
  .prompt { color: #7ee2a8; }
  .caret { display: inline-block; width: 8px; height: 16px; vertical-align: -3px; background: #e6e7e9; }
  .dim { color: #8a8f98; }
  .err { color: #ff6b6b; }
  .big { font-weight: 700; }
  .warn { color: #fcd34d; }
  .ok { color: #7ee2a8; }
  footer { height: 26px; flex: none; position: relative; display: flex; align-items: center; padding: 0 12px; border-top: 1px solid #222; font: 11px var(--sans); color: #666; }
  footer i { position: absolute; left: 0; bottom: 0; height: 2px; background: #d33; }

  .keycast { right: 44px; bottom: 120px; display: flex; justify-content: flex-end; gap: 6px; white-space: nowrap; }
  kbd { padding: 6px 10px; border: 1px solid #555; border-bottom-width: 3px; border-radius: 7px; background: #262628; color: #fff; font: 600 15px var(--sans); }

  .shot { left: 0; top: 0; transform-origin: 70px 12px; width: 740px; height: 500px; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06); }
  .shot p { white-space: pre; }
  .shot div { padding: 14px 16px; font-size: 13.5px; line-height: 23px; color: #e6e7e9; }
  .shot b { color: #7ee2a8; }
  .shot figcaption { position: absolute; right: 10px; bottom: 8px; padding: 3px 8px; border-radius: 5px; background: rgba(255, 255, 255, 0.08); font: 10.5px var(--sans); color: #8a8f98; }
  .cursor { left: 0; top: 0; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6)); }
</style>
