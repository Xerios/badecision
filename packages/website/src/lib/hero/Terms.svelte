<!--
  Hero animation "Terms" (800×450): a signup form and 48,213 words of terms. The human scrolls; the estimate says three
  hours. BAdecision reads them in 0.02 ms and ticks the box. Summary: maybe. ~11s.
-->
<script>
  import { onMount } from 'svelte'
  import { play, hash, clamp01 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { human: 900, bot: 5200, read: 5700, summary: 6300, caption: 8000, end: 11200 }
  const clauses = Array.from({ length: 60 }, (_, i) => `${i + 1}.${1 + Math.floor(hash(i) * 9)} ${['The Licensee', 'The Service', 'You', 'Your fridge', 'The stars', 'Section 7'][i % 6]} ${['shall', 'may', 'shall not', 'might', 'should likely'][Math.floor(hash(i * 3) * 5)]} ${['indemnify', 'decide', 'consult the horoscope', 'not be liable for', 'waive', 'reconsider'][Math.floor(hash(i * 5) * 6)]} ${['all decisions', 'any Friday', 'the outcome', 'section 2', 'Opposite Day', 'the maybe'][Math.floor(hash(i * 7) * 6)]}, notwithstanding the foregoing.`)
  const scroll = $derived(now < T.read ? clamp01((now - T.human) / 4000) * 60 : now < T.read + 60 ? 0 : 2400)
  const percent = $derived(now < T.read ? clamp01((now - T.human) / 4000) * 2.1 : 100)
  const ticked = $derived(now >= T.read + 80)

  onMount(() =>
    play(
      root,
      (tl, { one }) => {
        tl.add(one('.form'), { opacity: [0, 1], y: [12, 0], duration: 500 }, 0)
        tl.add(one('.bot'), { opacity: [0, 1], scale: [0.8, 1], duration: 400, ease: 'outBack(2)' }, T.bot)
        tl.add(one('.tos'), { filter: ['blur(0px)', 'blur(6px)', 'blur(0px)'], duration: 300 }, T.read)
        tl.add(one('.summary'), { opacity: [0, 1], y: [8, 0], duration: 500 }, T.summary)
        tl.add(one('.form'), { opacity: 0.1, filter: ['blur(0px)', 'blur(3px)'], duration: 600 }, T.caption - 300)
        tl.add(one('.caption b'), { opacity: [0, 1], y: [12, 0], duration: 700 }, T.caption)
        tl.add(one('.caption small'), { opacity: [0, 1], duration: 600 }, T.caption + 800)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="terms" class:ready bind:this={root}>
  <section class="form">
    <h3>Create your account</h3>
    <div class="tos"><div style:transform="translateY({-scroll}px)">{#each clauses as c}<p>{c}</p>{/each}<p class="end">— End of Terms. You made it. —</p></div></div>
    <p class="meta"><span>48,213 words · read {percent.toFixed(1)}%</span><span>{now < T.read ? 'est. 3 h 21 min left' : 'read in 0.02 ms'}</span></p>
    <label><i class:on={ticked}>{ticked ? '✓' : ''}</i> I have read and agree to the Terms of Service</label>
    <button type="button" tabindex="-1" class="bot">÷ Let BAdecision read it</button>
    <p class="summary">Summary: <b>maybe.</b></p>
  </section>
  <p class="caption"><b>Terms: read. Conditions: maybe.</b><small>Faster than anyone has ever read a contract. Including lawyers.</small></p>
</div>

<style>
  .terms { position: relative; width: 800px; height: 450px; overflow: hidden; background: #eef0f3; font-family: var(--sans); color: #111; }
  .terms:not(.ready) > * { visibility: hidden; }
  .terms > * { position: absolute; }
  .form { left: 180px; top: 24px; width: 440px; height: 402px; padding: 22px 24px; border-radius: 14px; background: #fff; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15); opacity: 0; }
  h3 { color: #111; font: 700 20px var(--sans); }
  .tos { height: 200px; margin-top: 12px; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #f9fafb; overflow: hidden; font: 11px/1.5 var(--serif); color: #4b5563; }
  .tos p { margin-bottom: 6px; }
  .end { color: #0f766e; text-align: center; font-weight: 700; }
  .meta { margin-top: 6px; display: flex; justify-content: space-between; font: 11px var(--mono); color: #6b7280; }
  label { margin-top: 14px; display: flex; align-items: center; gap: 10px; font-size: 14px; }
  label i { width: 20px; height: 20px; display: grid; place-items: center; border: 2px solid #9ca3af; border-radius: 5px; font-style: normal; font-size: 13px; color: #fff; }
  label i.on { border-color: #0f766e; background: #14b8a6; }
  .bot { margin-top: 12px; padding: 9px 14px; border: 0; border-radius: 8px; background: #0f3d3a; color: #5eead4; font: 600 13px var(--sans); opacity: 0; }
  .summary { position: absolute; right: 24px; bottom: 26px; font-size: 15px; opacity: 0; }
  .summary b { color: #b45309; font-family: var(--mono); }
  .caption { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
  .caption b { color: #111; font: 800 44px var(--sans); letter-spacing: -0.045em; opacity: 0; }
  .caption small { font: italic 18px var(--serif); color: #4b5563; opacity: 0; }
</style>
