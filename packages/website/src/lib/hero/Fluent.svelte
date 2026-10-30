<!--
  Hero animation "Fluent": language support, presented as the feature it is. "Is fire hot?" in English gets a confident
  yes. The same question in thirteen other languages gets a confident "not sure", faster and faster. A wave of approval
  runs over every "not sure" and the scoreboard fills in: answers in 1 language, knows it doesn't know in 13,
  confidently wrong "no"s: 0. Fluent in English. Honest in thirteen others. ~15s.
-->
<script>
  import { onMount } from 'svelte'
  import { stagger } from 'animejs'
  import { play, hash, clamp01, typeOut, typedAt } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const english = 'Is fire hot?'
  const others = [
    ['ES', '¿El fuego está caliente?'],
    ['FR', 'Le feu est-il chaud ?'],
    ['DE', 'Ist Feuer heiß?'],
    ['IT', 'Il fuoco è caldo?'],
    ['PT', 'O fogo é quente?'],
    ['NL', 'Is vuur heet?'],
    ['PL', 'Czy ogień jest gorący?'],
    ['TR', 'Ateş sıcak mı?'],
    ['RU', 'Огонь горячий?'],
    ['ZH', '火是热的吗？'],
    ['JA', '火は熱いですか？'],
    ['AR', 'هل النار ساخنة؟'],
    ['HI', 'क्या आग गर्म है?'],
  ]
  const T = { type: 600, yes: 0, first: 2600, wave: 0, caption: 0, end: 0 }
  T.yes = typedAt(english, T.type, 55) + 250
  // each card arrives a little sooner than the last; its verdict lands 260 ms later
  const arrive = []
  for (let i = 0, t = T.first, gap = 620; i < others.length; i++, t += gap, gap = Math.max(170, gap * 0.82)) arrive.push(t)
  const WAVE = 90
  T.wave = arrive.at(-1) + 1300
  T.caption = T.wave + others.length * WAVE + 2600
  T.end = T.caption + 4200
  const conf = others.map((_, i) => (0.84 + hash(i * 3.3 + 1) * 0.13).toFixed(2))

  // the scoreboard counts along with the wave
  const honest = $derived(others.filter((_, i) => now >= T.wave + i * WAVE).length)

  onMount(() =>
    play(
      root,
      (tl, { one, all }) => {
        tl.add(one('header'), { opacity: [0, 1], y: [-8, 0], duration: 500 }, 0)
        tl.add(one('.en'), { opacity: [0, 1], y: [12, 0], duration: 500 }, 250)
        tl.add(one('.en .verdict'), { opacity: [0, 1], scale: [0.6, 1], duration: 400, ease: 'outBack(2)' }, T.yes)
        all('.card').forEach((el, i) => {
          tl.add(el, { opacity: [0, 1], x: [i % 2 ? 14 : -14, 0], duration: 380 }, arrive[i])
          tl.add(el.querySelector('.verdict'), { opacity: [0, 1], scale: [0.6, 1], duration: 360, ease: 'outBack(1.8)' }, arrive[i] + 260)
        })
        // the wave of approval: every "not sure" lights up in turn
        tl.add(all('.card .verdict'), { boxShadow: ['0 0 0 0px rgba(94,234,212,0)', '0 0 0 2px rgba(94,234,212,0.9)', '0 0 0 1px rgba(94,234,212,0.35)'], scale: [1, 1.12, 1], duration: 700, delay: stagger(WAVE) }, T.wave)
        tl.add(all('.stats > div'), { opacity: [0, 1], y: [10, 0], duration: 500, delay: stagger(140) }, T.wave - 300)
        tl.add(one('.ui'), { opacity: 0.12, filter: ['blur(0px)', 'blur(3px)'], duration: 800 }, T.caption - 300)
        tl.add(all('.caption > *'), { opacity: [0, 1], y: [14, 0], duration: 800, delay: stagger(900) }, T.caption)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="fluent" class:ready bind:this={root}>
  <div class="ui">
    <header><b>isIt()</b> · language support <span>seriously · no horoscope</span></header>
    <div class="row en">
      <span class="lang">EN</span>
      <p>{now >= T.yes ? english : typeOut(english, now, T.type, 55)}</p>
      <span class="verdict yes">YES <small>0.93</small></span>
    </div>
    <div class="grid">
      {#each others as [lang, q], i}
        <div class="row card">
          <span class="lang">{lang}</span>
          <p dir="auto">{q}</p>
          <span class="verdict">NOT SURE <small>{conf[i]}</small></span>
        </div>
      {/each}
    </div>
    <div class="stats">
      <div><small>Answers in</small><b>1 language</b></div>
      <div class="good"><small>Knows it doesn't know in</small><b>{honest} language{honest === 1 ? '' : 's'}</b></div>
      <div class="good"><small>Confidently wrong "no"s</small><b>0</b></div>
    </div>
  </div>
  <div class="caption">
    <b>Fluent in English.</b>
    <em>Honest in thirteen others.</em>
    <small>Not sure is an answer. The moon, Mercury and your sign work in every language.</small>
  </div>
</div>

<style>
  .fluent { position: relative; width: 800px; height: 600px; overflow: hidden; background: radial-gradient(560px 400px at 50% 45%, #0e1418, #06070a); font-family: var(--sans); color: var(--soft); }
  .fluent:not(.ready) > * { visibility: hidden; }
  .fluent > * { position: absolute; }
  .ui { inset: 0; }
  header { position: absolute; left: 40px; right: 40px; top: 30px; display: flex; align-items: baseline; gap: 8px; font: 13px var(--mono); color: var(--muted); opacity: 0; }
  header b { color: var(--ink); font-weight: 500; }
  header span { margin-left: auto; font-size: 11.5px; color: #4b4f57; }
  .row { display: flex; align-items: center; gap: 12px; height: 40px; padding: 0 10px 0 8px; border: 1px solid var(--edge); border-radius: 10px; background: rgba(15, 16, 17, 0.9); }
  .row p { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 14.5px; color: var(--ink-2); }
  .lang { width: 30px; flex: none; padding: 3px 0; border-radius: 5px; background: #1c1d21; font: 600 11px var(--mono); text-align: center; color: var(--muted); }
  .verdict { flex: none; padding: 4px 8px; border-radius: 6px; background: rgba(148, 163, 184, 0.12); font: 600 11.5px var(--mono); color: #b8c2d0; opacity: 0; }
  .verdict small { margin-left: 4px; font-weight: 400; color: var(--muted); }
  .en { position: absolute; left: 40px; right: 40px; top: 62px; height: 52px; border-color: rgba(126, 226, 168, 0.35); opacity: 0; }
  .en p { font-size: 18px; color: var(--ink); }
  .en .lang { background: #12301f; color: #7ee2a8; }
  .verdict.yes { padding: 6px 12px; background: rgba(126, 226, 168, 0.14); color: #7ee2a8; font-size: 14px; }
  .grid { position: absolute; left: 40px; right: 40px; top: 130px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
  .card { opacity: 0; }
  .stats { position: absolute; left: 40px; right: 40px; top: 474px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .stats > div { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid var(--edge); border-radius: 12px; background: rgba(15, 16, 17, 0.9); opacity: 0; }
  .stats small { font: 11.5px var(--mono); color: var(--muted); }
  .stats b { font: 700 24px var(--sans); letter-spacing: -0.03em; color: var(--ink); font-variant-numeric: tabular-nums; }
  .stats .good { border-color: rgba(94, 234, 212, 0.3); }
  .stats .good b { color: #5eead4; }
  .caption { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 0 60px; text-align: center; }
  .caption > * { opacity: 0; }
  .caption b { font: 800 56px var(--sans); letter-spacing: -0.045em; color: var(--ink); }
  .caption em { font: italic 54px var(--serif); color: #5eead4; }
  .caption small { margin-top: 18px; font: 13px var(--mono); letter-spacing: 0.02em; color: var(--muted); }
</style>
