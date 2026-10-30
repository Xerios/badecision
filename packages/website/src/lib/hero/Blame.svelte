<!--
  Hero animation "Blame" (800×420): prod is down; git blame scrolls through the billing code looking for the culprit.
  Every line was written by BAdecision. Finally, someone to blame. ~12s.
-->
<script>
  import { onMount } from 'svelte'
  import { play, hash, clamp01, io3, typeOut } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const T = { type: 300, scroll: 2100, stop: 7200, hit: 7500, caption: 9000, end: 12200 }
  const code = [
    'export function charge(customer, amount) {', "  if (isItTrue('Is this customer real?')) {", "    if (isIt('Charge twice?') === 'maybe') retry()", '    // TODO: decide',
    "    const tax = isItTrue('Is tax a thing?') ? amount * 0.2 : 0", "    if (feelingLucky('Round up?')) amount = Math.ceil(amount)", "    if (isItTrulyTrue('Did it work?')) return ok()", '    return maybe()',
    '  }', "  if (isItFalse('Should we log this?')) log(customer)", "  return isIt('Was that a charge?')", '}', '', 'export function refund(id) {', "  return isIt(`Approve refund ${id}?`)", '}',
    '', 'export function deploy() {', "  if (isIt('Is it Friday?') === 'yes') return deployAnyway()", "  return isIt('Is it Friday yet?')", '}', '', '// prod is fine', "export const prod = isItTrue('Is prod fine?')",
  ]
  const LH = 22
  const offset = $derived(io3(clamp01((now - T.scroll) / (T.stop - T.scroll))) * (code.length - 12) * LH)
  const msgs = ['decide refunds', 'maybe fix billing', 'yes', 'no', 'revert "no"', 'decide tax', 'Opposite Day hotfix', 'not sure']

  onMount(() =>
    play(
      root,
      (tl, { one }) => {
        tl.add(one('.alert'), { opacity: [0, 1], y: [-20, 0], duration: 400, ease: 'outBack(1.6)' }, 0)
        tl.add(one('.win'), { opacity: [0, 1], y: [10, 0], duration: 500 }, 200)
        tl.add(one('.hl'), { opacity: [0, 1], duration: 300 }, T.hit)
        tl.add(one('.win'), { opacity: 0.12, filter: ['blur(0px)', 'blur(2px)'], duration: 600 }, T.caption - 300)
        tl.add(one('.caption b'), { opacity: [0, 1], scale: [1.2, 1], duration: 600, ease: 'outBack(1.5)' }, T.caption)
        tl.add(one('.caption small'), { opacity: [0, 1], duration: 600 }, T.caption + 800)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="blame" class:ready bind:this={root}>
  <p class="alert">🚨 prod-01 is down · 2,481 customers charged twice</p>
  <section class="win">
    <p class="cmd"><span>$</span> {typeOut('git blame src/billing.ts', now, T.type, 50)}</p>
    <div class="code">
      <div style:transform="translateY({-offset}px)">
        {#each code as line, i}
          <p class:last={i === code.length - 1}>
            <span class="sha">{Math.floor(hash(i + 1) * 0xfffffff).toString(16).padStart(7, '0')}</span>
            <span class="who">(BAdecision</span>
            <span class="when">2026-10-{String(10 + (i % 20)).padStart(2, '0')}</span>
            <span class="msg">{msgs[i % msgs.length]})</span>
            <span class="n">{i + 1}</span>
            <code>{line}</code>
          </p>
        {/each}
      </div>
      <i class="hl"></i>
    </div>
  </section>
  <p class="caption"><b>Finally, someone to blame.</b><small>Every line. Every commit. Commit message: "maybe".</small></p>
</div>

<style>
  .blame { position: relative; width: 800px; height: 420px; overflow: hidden; background: #0b0b0c; font-family: var(--sans); color: var(--soft); }
  .blame:not(.ready) > * { visibility: hidden; }
  .blame > * { position: absolute; }
  .alert { left: 20px; right: 20px; top: 14px; padding: 8px 14px; border-radius: 8px; background: #7f1d1d; color: #fff; font: 600 13px var(--sans); opacity: 0; }
  .win { left: 20px; right: 20px; top: 56px; bottom: 20px; padding: 12px 14px; border: 1px solid var(--edge-strong); border-radius: 10px; background: #0d0d0f; font: 12px var(--mono); opacity: 0; }
  .cmd { color: var(--ink-2); font-size: 13px; }
  .cmd span { color: #7ee2a8; }
  .code { position: relative; height: 290px; margin-top: 10px; overflow: hidden; }
  .code p { height: 22px; display: flex; align-items: center; gap: 10px; white-space: pre; }
  .sha { color: #d29922; }
  .who { color: #5eead4; }
  .when, .msg { color: #6e7681; }
  .msg { width: 150px; overflow: hidden; text-overflow: ellipsis; }
  .n { width: 22px; text-align: right; color: #4b4f57; }
  code { color: var(--ink-2); }
  .hl { position: absolute; left: -4px; right: -4px; bottom: 0; height: 22px; border: 1px solid #f85149; border-radius: 4px; background: rgba(248, 81, 73, 0.12); opacity: 0; }
  .caption { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
  .caption b { color: var(--ink); font: 800 48px var(--sans); letter-spacing: -0.045em; opacity: 0; }
  .caption small { font: 14px var(--mono); color: var(--muted); opacity: 0; }
</style>
