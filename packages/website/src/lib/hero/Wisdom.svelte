<!--
  Hero animation "Wisdom": inspirational-poster quotes from Hacker News commenters, then the comment thread under the
  BAdecision launch, then BAdecision's own contribution: "It's not AI. It's SI." [flagged]. ~23s.
-->
<script>
  import { onMount } from 'svelte'
  import { play, hash, clamp01, out3 } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const quotes = [
    ["It's not automation — it's transformation.", 'throwaway_8812', 1204],
    ['The real problem was never the code.', 'rustacean_1987', 877],
    ['Most developers write code. Great developers build systems.', '10x_ceo', 2311],
    ['Not another tool. Not another framework. A revolution.', 'founder_mode', 645],
    ['One developer. Three days. Zero compromises.', 'weekendbuilder', 1580],
    ['But what if everything you knew was wrong?', 'contrarian_42', 431],
    ['I could be wrong, but booleans are a solved problem and always will be.', 'pg_fan_99', 3021],
    ['The lesson? Technology is only as powerful as the people behind it.', 'linkedin_refugee', 990],
  ]
  const PER = 1800
  const THREAD = quotes.length * PER + 300
  const thread = [
    [0, 'grumpy_sre', "Here's the thing."],
    [1, 'throwaway_8812', "Let's be honest for a second."],
    [2, 'founder_mode', 'This is HUGE.'],
    [1, 'contrarian_42', "This might be an unpopular opinion... but it's fine."],
    [2, 'pg_fan_99', "That's a really interesting point."],
    [3, '10x_ceo', 'Read that again.'],
    [0, 'weekendbuilder', "And that's the future of software development."],
  ]
  const FINAL = THREAD + 600 + thread.length * 480 + 1500
  const END = FINAL + 3600
  const fade = (start, dur) => clamp01((now - start) / 350) * (1 - clamp01((now - start - dur + 350) / 350))

  onMount(() => play(root, tl => END, { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) }))
</script>

<div class="wisdom" class:ready bind:this={root}>
  {#each quotes as [text, user, points], i}
    {@const at = 200 + i * PER}
    {@const o = fade(at, PER)}
    {#if o > 0}
      <figure style:opacity={o} style:--h={Math.floor(hash(i * 3) * 360)}>
        <div class="bg" style:scale={1 + 0.06 * clamp01((now - at) / PER)}></div>
        <blockquote style:translate="0 {(1 - out3(clamp01((now - at) / 500))) * 14}px">{text}</blockquote>
        <figcaption>— {user}, on Hacker News · {points.toLocaleString('en-US')} points</figcaption>
      </figure>
    {/if}
  {/each}

  {#if now >= THREAD - 300 && now < FINAL + 400}
    <section class="hn" style:opacity={clamp01((now - THREAD + 300) / 300) * (1 - clamp01((now - FINAL) / 400))}>
      <header><b>Y</b><strong>Hacker News</strong><span>new | past | comments | ask | show | jobs | submit</span></header>
      <div class="post">
        <p class="title">▲ BAdecision: Balanced Assessment Decisions <small>(badecision.dev)</small></p>
        <p class="meta">1204 points by throwaway_8812 3 hours ago | hide | 812 comments</p>
        {#each thread as [depth, user, text], i}
          {@const at = THREAD + 600 + i * 480}
          {#if now >= at}
            <div class="c" style:margin-left="{depth * 34}px" style:opacity={clamp01((now - at) / 250)}>
              <p class="meta">▲ {user} {2 + i * 3} minutes ago | next [–]</p>
              <p>{text}</p>
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/if}

  {#if now >= FINAL}
    <figure class="final" style:opacity={clamp01((now - FINAL) / 500)}>
      <div class="bg"></div>
      <blockquote>It's not AI.<br />It's SI.</blockquote>
      <figcaption>— BAdecision, on Hacker News · <span class="flag">[flagged]</span></figcaption>
    </figure>
  {/if}
</div>

<style>
  .wisdom { position: relative; width: 800px; height: 600px; overflow: hidden; background: #0a0a0a; font-family: var(--sans); }
  .wisdom:not(.ready) > * { visibility: hidden; }
  figure { position: absolute; inset: 0; margin: 0; display: flex; flex-direction: column; justify-content: center; gap: 28px; padding: 0 90px; }
  .bg { position: absolute; inset: -20px; z-index: 0; background: radial-gradient(500px 360px at 30% 30%, hsl(var(--h) 45% 30%), transparent), radial-gradient(600px 400px at 80% 90%, hsl(calc(var(--h) + 60) 40% 20%), #0a0a0a); }
  blockquote { position: relative; z-index: 1; margin: 0; font: italic 400 46px/1.15 var(--serif); letter-spacing: -0.01em; color: #fff; text-shadow: 0 4px 30px rgba(0, 0, 0, 0.6); }
  blockquote::before { content: '“'; position: absolute; left: -46px; top: -26px; font-size: 110px; color: rgba(255, 255, 255, 0.25); }
  figcaption { position: relative; z-index: 1; font: 14px var(--mono); color: rgba(255, 255, 255, 0.7); }
  .hn { position: absolute; inset: 30px; background: #f6f6ef; color: #000; font: 13px Verdana, Geneva, sans-serif; }
  .hn header { height: 28px; padding: 0 4px; display: flex; align-items: center; gap: 8px; background: #ff6600; }
  .hn header b { width: 18px; height: 18px; display: grid; place-items: center; border: 1px solid #fff; color: #fff; font-size: 12px; }
  .hn header span { color: #000; }
  .post { padding: 12px 14px; }
  .title { font-size: 15px; }
  .title small { color: #828282; }
  .meta { color: #828282; font-size: 11px; }
  .post > .meta { margin: 2px 0 14px 16px; }
  .c { margin-bottom: 12px; padding-left: 16px; }
  .c p:last-child { font-size: 14px; }
  .final .bg { background: radial-gradient(500px 360px at 50% 40%, #134e4a, #0a0a0a); }
  .final blockquote { font-size: 76px; font-style: normal; font-family: var(--sans); font-weight: 700; letter-spacing: -0.05em; }
  .flag { color: #ff6600; }
</style>
