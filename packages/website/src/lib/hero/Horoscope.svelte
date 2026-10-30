<!--
  Hero animation "Horoscope" (800×470): the developer horoscope column for Friday, one sign at a time, with an
  astrological influence of exactly 0.5. Ends with the only reading that matters. ~14s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const signs = [
    ['♈', 'Aries', 'Bold refactor energy today. Don’t.'], ['♉', 'Taurus', 'A stubborn bug persists. So do you.'], ['♊', 'Gemini', 'Two branches, one truth: merge conflict.'],
    ['♋', 'Cancer', 'Protect your main branch. Emotionally.'], ['♌', 'Leo', 'Mercury is retrograde. Avoid merges. Lucky number: 404.'], ['♍', 'Virgo', 'Your linter loves you. Nobody else does.'],
    ['♎', 'Libra', 'A balanced assessment is coming. It is maybe.'], ['♏', 'Scorpio', 'Your Friday deploys are decided by you. Velocity is up.'], ['♐', 'Sagittarius', 'Adventure awaits, in production.'],
    ['♑', 'Capricorn', 'Ship it. Then ship it again.'], ['♒', 'Aquarius', 'A stranger opens a PR titled “small fix”. It is not.'], ['♓', 'Pisces', 'You will dream in YAML.'],
  ]
  const T = { cards: 700, per: 650, final: 9600, end: 14000 }

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('header'), { opacity: [0, 1], y: [-8, 0], duration: 500 }, 0)
        tl.add(all('.sign'), { opacity: [0, 1], rotateY: [-90, 0], duration: 450, ease: 'outBack(1.2)', delay: stagger(T.per) }, T.cards)
        tl.add(one('.stamp'), { opacity: [0, 1], scale: [2, 1], duration: 300, ease: 'inQuad' }, T.cards + 12 * T.per + 200)
        tl.add(one('.paper'), { opacity: 0.1, filter: ['blur(0px)', 'blur(3px)'], duration: 700 }, T.final - 300)
        tl.add(one('.final b'), { opacity: [0, 1], y: [12, 0], duration: 700 }, T.final)
        tl.add(one('.final small'), { opacity: [0, 1], duration: 700 }, T.final + 1000)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="horoscope" class:ready bind:this={root}>
  <div class="paper">
    <header><b>Developer Horoscopes</b><span>Friday · astrological influence: 0.5 (fixed)</span></header>
    <div class="grid">
      {#each signs as [glyph, name, text]}
        <article class="sign"><p><i>{glyph}</i> {name}</p><span>{text}</span></article>
      {/each}
    </div>
    <p class="stamp">Powered by isIt()</p>
  </div>
  <p class="final"><b>Your sign doesn’t matter.<br />Your answer is maybe.</b><small>BAdecision reads the horoscope daily, so you don’t have to.</small></p>
</div>

<style>
  .horoscope { position: relative; width: 800px; height: 470px; overflow: hidden; background: #1c1a17; font-family: var(--serif); color: #2b2620; }
  .horoscope:not(.ready) > * { visibility: hidden; }
  .horoscope > * { position: absolute; }
  .paper { inset: 16px; padding: 16px 20px; background: #f1ead8; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6); }
  header { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 8px; border-bottom: 3px double #2b2620; opacity: 0; }
  header b { color: #1b1712; font: 700 30px var(--serif); }
  header span { font: italic 14px var(--serif); }
  .grid { margin-top: 12px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px 14px; perspective: 800px; }
  .sign { padding: 8px 10px; border: 1px solid rgba(43, 38, 32, 0.25); background: rgba(255, 255, 255, 0.35); opacity: 0; }
  .sign p { font: 700 15px var(--serif); color: #1b1712; }
  .sign i { font-style: normal; color: #7c3aed; }
  .sign span { display: block; margin-top: 2px; font: 13px/1.35 var(--serif); }
  .stamp { position: absolute; right: 30px; bottom: 14px; padding: 4px 12px; border: 3px solid #0f766e; border-radius: 6px; color: #0f766e; font: 800 16px var(--sans); rotate: -6deg; opacity: 0; }
  .final { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
  .final b { color: #f7f8f8; font: 800 44px/1.1 var(--sans); letter-spacing: -0.045em; opacity: 0; }
  .final small { font: italic 18px var(--serif); color: #c9ccd1; opacity: 0; }
</style>
