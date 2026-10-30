<!--
  Hero animation "Community" (800×500): the BAdecision Discussions board, proudly scrolling through its thirty hottest
  threads ("I built a bank in 24 hours", "The death of the boolean", ...), then stopping on the pinned one. ~17s.
-->
<script>
  import { onMount } from 'svelte'
  import { play, hash, clamp01, io3, fmt } from './stage.js'

  let { still = false, onend } = $props()
  let root
  let ready = $state(false)
  let now = $state(0)

  const titles = [
    'Why if-statements are dead.',
    'The death of the boolean.',
    'The future of yes is maybe.',
    'I replaced my entire QA team with isItTrue().',
    'I built a bank in 24 hours.',
    'I built a self-driving car in a weekend with isIt().',
    'I spent 6 months building a wrapper for isIt(). Here’s what I learned.',
    'Everything you know about decisions is wrong.',
    'Why nobody is talking about Opposite Day.',
    'The hidden problem with "not sure".',
    'Mercury retrograde will change everything.',
    'The ultimate guide to maybe.',
    'The complete guide to StringToBooleanFactory (requires initialization).',
    '10 things I wish I knew before asking the stars.',
    'Stop writing logic. Start asking.',
    'Why developers are abandoning else.',
    'The technology that will replace programmers.',
    'I made an open-source alternative to BAdecision. It’s also BAdecision.',
    'I created a better version of maybe.',
    'What happens when you combine horoscopes and AI?',
    'I gave an AI agent full control of my computer. It asked BAdecision.',
    'I let BAdecision build an entire startup.',
    'I automated my entire job with isItTrue().',
    'This one trick made my application 100x faster.',
    'Nobody understands the implications of 0.5 astrological influence.',
    'The uncomfortable truth about software engineering.',
    'The billion-dollar opportunity nobody sees: Fridays.',
    'Why traditional software development is obsolete.',
    'The next big thing in technology.',
    'I went down a rabbit hole...',
  ]
  const cats = ['🔥 Hot takes', '💡 Ideas', '🙌 Show and tell', '🙏 Q&A', '📈 Growth']
  const users = ['10x_ceo', 'founder_mode', 'weekendbuilder', 'rustacean_1987', 'promptlord', 'yes_man', 'maybe_later', 'astro_dev']
  const rows = titles.map((t, i) => ({
    t,
    cat: cats[Math.floor(hash(i) * cats.length)],
    user: users[Math.floor(hash(i * 3) * users.length)],
    replies: Math.floor(40 + hash(i * 5) ** 3 * 4000),
    views: Math.floor(2000 + hash(i * 7) ** 2 * 900000),
    votes: Math.floor(10 + hash(i * 11) ** 2 * 3000),
    hot: hash(i * 13) > 0.6,
  }))
  const ROW = 58
  const T = { scroll: 1600, stop: 13200, pin: 13600, answered: 14600, end: 17600 }
  // scroll: slow start, then proudly fast, then a gentle stop
  const offset = $derived(io3(clamp01((now - T.scroll) / (T.stop - T.scroll))) * (rows.length - 4) * ROW)
  const members = $derived(Math.floor(1_200_000 + now * 3.1))

  onMount(() =>
    play(
      root,
      (tl, { one }) => {
        tl.add(one('.gh'), { opacity: [0, 1], y: [12, 0], duration: 600 }, 0)
        tl.add(one('.award'), { opacity: [0, 1], scale: [1.4, 1], rotate: [10, 4], duration: 500, ease: 'outBack(1.8)' }, 900)
        tl.add(one('.list'), { opacity: 0.15, filter: ['blur(0px)', 'blur(2px)'], duration: 500 }, T.pin - 200)
        tl.add(one('.pin'), { opacity: [0, 1], scale: [0.92, 1], duration: 600, ease: 'outBack(1.4)' }, T.pin)
        tl.add(one('.answer'), { opacity: [0, 1], y: [8, 0], duration: 500 }, T.answered)
        return T.end
      },
      { still, onend, onUpdate: t => (now = t), onReady: () => (ready = true) },
    ),
  )
</script>

<div class="community" class:ready bind:this={root}>
  <div class="gh">
    <header>
      <p><b>...</b> / <b>badecision</b> <small>Public</small></p>
      <nav>
        <span>Code</span><span class="off">Issues <small>disabled</small></span><span class="on">Discussions <small>{fmt(12408)}</small></span><span
          >Actions</span
        >
      </nav>
    </header>
    <div class="bar"><b>Trending this week</b><span>{fmt(members)} members · 1 test · 0 bugs</span></div>
    <div class="list">
      <div style:transform="translateY({-offset}px)">
        {#each rows as r}
          <article>
            <i class="av" style:background="hsl({Math.floor(hash(r.replies) * 360)} 50% 40%)">{r.user[0].toUpperCase()}</i>
            <div>
              <h4>
                {r.t}{#if r.hot}<span class="hot">🔥 Hot</span>{/if}
              </h4>
              <p>{r.user} started this in <b>{r.cat}</b></p>
            </div>
            <span class="n">▲ {fmt(r.votes)}</span>
            <span class="n">💬 {fmt(r.replies)}</span>
            <span class="n">👁 {fmt(r.views)}</span>
          </article>
        {/each}
      </div>
    </div>
    <div class="pin">
      <p class="tag">📌 Pinned · 📣 Announcements</p>
      <h3>Issues are disabled. Please discuss here.</h3>
      <p class="meta">maintainer · 41,233 replies · 3.1M views</p>
      <p class="answer">✓ <b>Answered</b> by BAdecision: <em>maybe</em></p>
    </div>
  </div>
  <p class="award">🏆 Most active community of 2026<small>*among packages with exactly one test</small></p>
</div>

<style>
  .community {
    position: relative;
    width: 800px;
    height: 500px;
    overflow: hidden;
    background: #010409;
    font-family: var(--sans);
    color: #e6edf3;
  }
  .community:not(.ready) > * {
    visibility: hidden;
  }
  .community > * {
    position: absolute;
  }
  .gh {
    inset: 16px;
    border: 1px solid #30363d;
    border-radius: 10px;
    background: #0d1117;
    overflow: hidden;
    opacity: 0;
  }
  header {
    padding: 14px 18px 0;
    border-bottom: 1px solid #30363d;
  }
  header p {
    font-size: 16px;
    color: #e6edf3;
  }
  header p b {
    color: #58a6ff;
    font-weight: 600;
  }
  header small {
    margin-left: 6px;
    padding: 1px 7px;
    border: 1px solid #30363d;
    border-radius: 999px;
    font-size: 11px;
    color: #8d96a0;
  }
  nav {
    margin-top: 12px;
    display: flex;
    gap: 20px;
    font-size: 13.5px;
    color: #8d96a0;
  }
  nav span {
    padding-bottom: 10px;
  }
  nav .on {
    color: #e6edf3;
    border-bottom: 2px solid #f78166;
  }
  nav .off {
    text-decoration: line-through;
  }
  nav small {
    margin-left: 4px;
  }
  .bar {
    height: 44px;
    padding: 0 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    color: #8d96a0;
  }
  .bar b {
    color: #e6edf3;
  }
  .list {
    position: absolute;
    left: 0;
    right: 0;
    top: 136px;
    bottom: 0;
    overflow: hidden;
    mask-image: linear-gradient(transparent, #000 20px, #000 85%, transparent);
  }
  article {
    height: 58px;
    padding: 0 18px;
    display: grid;
    grid-template-columns: 30px 1fr 64px 76px 86px;
    align-items: center;
    gap: 12px;
    border-top: 1px solid #21262d;
  }
  .av {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font: 700 12px var(--sans);
    font-style: normal;
    color: #fff;
  }
  h4 {
    overflow: hidden;
    color: #e6edf3;
    font: 600 14px var(--sans);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .hot {
    margin-left: 8px;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(248, 81, 73, 0.15);
    color: #ff7b72;
    font-size: 11px;
  }
  article h4 {
    margin: 4px 0;
  }
  article p {
    font-size: 12px;
    color: #8d96a0;
  }
  article p b {
    color: #c9d1d9;
    font-weight: 500;
  }
  .n {
    font-size: 12px;
    color: #8d96a0;
    white-space: nowrap;
  }
  .pin {
    position: absolute;
    left: 110px;
    right: 110px;
    top: 170px;
    padding: 22px 24px;
    border: 1px solid #3fb950;
    border-radius: 12px;
    background: #0d1117;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
    opacity: 0;
  }
  .tag {
    font-size: 12px;
    color: #8d96a0;
  }
  .pin h3 {
    margin: 8px 0 4px;
    color: #e6edf3;
    font: 700 22px var(--sans);
    letter-spacing: -0.02em;
  }
  .pin .meta {
    font-size: 12.5px;
    color: #8d96a0;
  }
  .answer {
    margin-top: 14px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(63, 185, 80, 0.12);
    color: #3fb950;
    font-size: 14px;
    opacity: 0;
  }
  .answer em {
    font-family: var(--mono);
    font-style: normal;
    color: #fcd34d;
  }
  .award {
    right: 34px;
    top: 26px;
    padding: 6px 12px;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    background: #d29922;
    color: #1a1300;
    font: 700 12px var(--sans);
    rotate: 4deg;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    opacity: 0;
  }
  .award small {
    font-weight: 500;
    font-size: 9.5px;
  }
</style>
