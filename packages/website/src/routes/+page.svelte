<script>
  import Section from '#lib/blocks/Section.svelte'
  import Split from '#lib/blocks/Split.svelte'
  import Columns from '#lib/blocks/Columns.svelte'
  import Intro from '#lib/components/Intro.svelte'
  import Window from '#lib/components/Window.svelte'
  import Facts from '#lib/components/Facts.svelte'
  import Table from '#lib/components/Table.svelte'
  import Install from '#lib/components/Install.svelte'
  import Playground from '#lib/components/Playground.svelte'
  import HeroAnimation from '#lib/hero/HeroAnimation.svelte'
  import { badges, dashboard, customers, bias, testRun, features, api, releases, modelCard, benchmarks, bundle, testimonials, tiers, faq } from '#lib/content.js'
  import { example, test, packageJson, tree, license, refundsDiff } from '#lib/snippets.js'
  import { esc, highlight, rich } from '#lib/text.js'

  const initials = name => name.split(/[\s-]+/).slice(0, 2).map(w => w[0]).join('')

  // "path    note": the note (after two or more spaces) is dimmed; "<n> lines" gets its number highlighted
  const treeHtml = tree
    .split('\n')
    .map(line => {
      const [, path, gap, num = '', note] = line.match(/^(.*?\S)(\s{2,})([\d,]+(?= lines))?(.*)$/) ?? [, line, '', '', '']
      return esc(path) + gap + (num && `<span class="n">${num}</span>`) + (note && `<span class="c">${esc(note)}</span>`)
    })
    .join('\n')
</script>

<svelte:head>
  <title>BAdecision: Balanced Assessment Decisions</title>
  <meta name="description" content="Decisions as a service, without the service. Yes, no, maybe or not sure, on-device, with a little help from the stars." />
</svelte:head>

<Section label="BAdecision" tone="dots" line={false} pad="clamp(32px, 5vw, 56px) var(--gutter) 96px" gap="48px">
  <HeroAnimation />
  <Columns min="480px">
    <div class="hero">
      <h1>Balanced Assessment Decisions</h1>
      <p>The <em>decision</em> infrastructure for the modern enterprise.</p>
      <p>
        Decisions as a service, without the service. BAdecision answers yes, no, maybe or not sure, on-device, in about 20 microseconds, with a confidence score
        your auditors will find difficult to question.
      </p>
      <p>
        <a class="button primary" href="#install">Start now <span aria-hidden="true">›</span></a>
        <a class="button" href="#pricing">Contact sales <span aria-hidden="true">›</span></a>
      </p>
      <Install id="install" />
      <ul aria-label="Badges">
        {#each badges as [label, value, color]}<li><span>{label}</span><span style:background={color}>{value}</span></li>{/each}
      </ul>
      <small>0 API keys · 0 dependencies · 0 bugs¹ · 100% test coverage² · hand-written by AI</small>
    </div>

    <div class="card dashboard">
      <header><span>Decisions · Production</span><span>Live</span></header>
      <dl>
        {#each dashboard.stats as [label, value]}<div><dt>{label}</dt><dd>{value}</dd></div>{/each}
      </dl>
      <p aria-hidden="true">
        {#each dashboard.bars as h}<i style:height="{h}%"></i>{/each}
      </p>
      <table>
        <caption>Recent decisions</caption>
        <tbody>
          {#each dashboard.recent as [id, verdict]}
            <tr><td>{id}</td><td><span data-verdict={verdict}>{verdict}</span></td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Columns>
</Section>

<Section label="Playground" pad="72px var(--gutter) 24px">
  <Playground />
</Section>

<Section label="Customers" line={false} pad="48px var(--gutter)">
  <figure class="logos">
    <figcaption>Trusted by teams who did not ask</figcaption>
    <ul>
      {#each customers as [name, style]}<li {style}>{name}</li>{/each}
    </ul>
  </figure>
</Section>

<Section id="product" label="Product" tone="alt" pad="104px var(--gutter)" gap="112px">
  <Split
    icon="code"
    eyebrow="Embed"
    title="Modernize legacy boolean logic in a single line."
    text="Conditionals that evaluate to true or false are a source of rigidity across the enterprise. BAdecision replaces them with outcomes that reflect the real world: 'true', false or null. Only a yes is truthy."
    list={['Runs in Node, Deno, Bun and the browser', 'Per-tenant isolation with create({ birthday })', 'Strict mode for regulated workloads (isItTrueStrict)']}>
    <Window title="src/refunds.js">
      <pre class="diff">{#each refundsDiff as [n, op, code]}<span data-op={op}><span>{String(n).padStart(4)} {op === '-' ? '−' : op || ' '} </span>{code}</span>{/each}</pre>
      <p>
        A yes is the string <code>'true'</code>, a no is a real <code>false</code>, and maybe is <code>null</code>: a boolean that is sometimes a string, and
        occasionally not a boolean at all.
      </p>
    </Window>
  </Split>

  <Split
    flip
    icon="sliders"
    eyebrow="Governance"
    title="Bias you can audit, configure and blame."
    text="Every model is biased. Most vendors hide it. BAdecision derives its bias from the birthday you configure and today's sky, and when a daily omen matches the question, the omen wins. Influence is fixed at a cosmically balanced 0.5; adjusting it requires the cloud-hosted version."
    note="Compliance note: every January 25 is Opposite Day. Yes means no. This cannot be disabled.">
    <div class="card bias">
      <h3>Bias configuration</h3>
      <ul>
        {#each bias.signs as sign}<li aria-current={sign === bias.active || null}>{sign}</li>{/each}
      </ul>
      <hr />
      <Facts rows={bias.facts} pad="7px 0" lines={false} />
    </div>
  </Split>

  <Split
    icon="wrench"
    eyebrow="Engineering"
    title="Built with the rigor your security team expects."
    text="Zero dependencies, zero bugs. We wrote our own TypeScript compiler, in Python, so nothing from npm ever touches your build. One test covers 100% of lines, branches and functions. Every line was hand-written by AI.">
    <div class="card facts"><Facts rows={testRun} /></div>
  </Split>
</Section>

<Section id="features" title="Everything you need. Nothing you'd expect." small line={false} gap="32px">
  <Columns min="250px" gap="12px" align="stretch">
    {#each features as f}
      <article class="card feature">
        {#if f.stat}<strong>{f.stat}</strong>{:else}<code>{f.tag}</code>{/if}
        <h3>{f.title}</h3>
        <p>{@html rich(f.text)}</p>
      </article>
    {/each}
  </Columns>
</Section>

<Section
  id="api"
  tone="alt"
  icon="braces"
  eyebrow="API"
  title="A small API surface. Smaller than it looks."
  text="Every function takes a plain string. Every function is synchronous, except the serious ones. Every function consults the model and the stars, including the ones that don't need to.">
  <Columns min="460px" gap="20px" align="start">
    <Window title="example.js"><pre>{@html highlight(example)}</pre></Window>
    <div class="card facts"><Facts rows={api} labelWidth="180px" pad="14px 18px" /></div>
  </Columns>
</Section>

<Section id="changelog" label="Changelog">
  <Split
    min="380px"
    gap="48px"
    align="start"
    icon="sparkle"
    eyebrow="Changelog"
    title="BAdecision 2.0. Now taking things seriously."
    text="Our biggest release yet adds a second, much better model for the decisions that matter. It reads the same horoscope.">
    <ol class="timeline">
      {#each releases as r, i}
        <li data-dot={i === 0 ? 'latest' : r.major ? 'major' : null}>
          <p><code>{r.version}</code>{#if i === 0}<small>Latest</small>{:else if r.major}<mark>Major</mark>{/if}</p>
          <p>{@html rich(r.text)}</p>
        </li>
      {/each}
    </ol>
  </Split>
</Section>

<Section id="model-card" tone="alt" icon="card" eyebrow="Model card" title="Everything you need to know">
  <article class="card model-card">
    <header>
      <h3>badecision/balanced-assessment-decisions-2.0.1</h3>
      <small>Last updated Oct 30, 2026</small>
      <ul>
        {#each modelCard.tags as tag}<li>{tag}</li>{/each}
      </ul>
    </header>
    <Facts rows={modelCard.facts} labelWidth="170px" columns="460px" pad="14px 26px" />
  </article>
</Section>

<Section
  id="benchmarks"
  icon="chart"
  eyebrow="Benchmarks"
  title="Independently benchmarked by benchmarks."
  text="Evaluated on SomeBench and TrustMeBench, two industry benchmarks we are confident exist.³">
  <Columns min="460px" gap="20px" align="stretch">
    <figure class="card chart">
      <figcaption>SomeBench · decisions per second <small>Higher is better</small></figcaption>
      <ul>
        {#each benchmarks.speed as [name, width], i}<li data-ours={i === 0 || null}>{name}<i style:width></i></li>{/each}
      </ul>
      <small>We had to extend the page to plot ourselves.</small>
    </figure>
    <figure class="card chart">
      <figcaption>TrustMeBench · hallucination rate <small>Lower is better</small></figcaption>
      <ol>
        {#each benchmarks.hallucination as [name, value, height], i}
          <li data-ours={i === benchmarks.hallucination.length - 1 || null}><span>{value}<i style:height="{height}px"></i></span>{name}</li>
        {/each}
      </ol>
      <small>Bars not to scale. Neither are the claims. *Self-reported.</small>
    </figure>
  </Columns>
  <Table caption="How we compare" {...benchmarks.compare} highlight={1} rowHeaders minWidth="720px" />
</Section>

<Section id="quality" label="Quality">
  <Split
    min="460px"
    gap="48px"
    align="start"
    icon="shield"
    eyebrow="Quality"
    title="One test. 100% coverage. Zero bugs."
    text="The test suite consists of one test, with 100% line, branch and function coverage of the package source. Every line of it was hand-written by AI.">
    {#snippet more()}
      <dl class="counters">
        <div><dt>coverage²</dt><dd>100%</dd></div>
        <div><dt>test</dt><dd>1</dd></div>
        <div><dt>open issues¹</dt><dd>0</dd></div>
      </dl>
    {/snippet}
    <Window title="test/index.test.js" aside="✓ 1 passed" tone="ok"><pre>{@html highlight(test)}</pre></Window>
  </Split>
</Section>

<Section id="supply-chain" label="Supply chain" tone="alt" gap="40px">
  <Split
    min="460px"
    gap="48px"
    align="start"
    icon="box"
    eyebrow="Supply chain"
    title="Zero dependencies. We wrote our own TypeScript compiler. In Python."
    text="No left-pad. No is-even. No supply-chain risk. Every tool in the chain is first-party, implemented from first principles, by someone who had the time.">
    {#snippet more()}<pre class="card">{@html highlight(packageJson)}</pre>{/snippet}
    <Window title="badecision/" aside="first-party only"><pre>{@html treeHtml}</pre></Window>
  </Split>
  <Table caption="Bundle size · ESM, tree-shakes" {...bundle} mono />
</Section>

<Section id="license" label="License">
  <div class="license">
    <Intro
      icon="scale"
      eyebrow="License"
      title="Licensing"
      text="We believe research should be open. We also believe it should be ours. The BAdecision Public Private License (BPPL-1.0) reflects both positions without favoring either."
      note="The `license` field in `package.json` reads `MIT AND UNLICENSED`. npm accepts this." />
    <pre class="card">{license}</pre>
  </div>
</Section>

<Section id="testimonials" tone="alt" title="Loved by engineers, human and agent." small>
  <Columns min="320px" gap="12px" align="stretch">
    {#each testimonials as t}
      <figure class="card quote">
        <blockquote lang={t.lang}>{t.quote}</blockquote>
        <figcaption>
          <i style:background={t.avatar?.[0]} style:color={t.avatar?.[1]}>{t.initials ?? initials(t.name)}</i>
          <span><b>{t.name}</b>{t.role}</span>
        </figcaption>
      </figure>
    {/each}
  </Columns>
</Section>

<Section id="pricing" title="Simple, transparent pricing." text="There is no API, so there is nothing to meter." center>
  <Columns min="290px" gap="12px" align="stretch">
    {#each tiers as tier}
      <article class="card tier" aria-current={tier.badge ? true : null}>
        <h3>{tier.name}{#if tier.badge}<mark>{tier.badge}</mark>{/if}</h3>
        <p><strong>{tier.price}</strong> {tier.period ?? ''}</p>
        <ul>
          {#each tier.features as f}<li>{@html rich(f)}</li>{/each}
        </ul>
        <a class={['button', tier.badge && 'primary']} href={tier.cta[1]}>{tier.cta[0]}</a>
      </article>
    {/each}
  </Columns>
  <small style:text-align="center">Rate limits: none. Usage-based billing: none. The cloud-hosted version has no launch date, so its price is accurate.</small>
</Section>

<Section id="faq" title="Frequently asked questions" small width="820px" gap="28px">
  <div>
    {#each faq as [q, a]}
      <details>
        <summary>{q}</summary>
        <p>{@html rich(a)}</p>
      </details>
    {/each}
  </div>
</Section>

<Section label="Get started" tone="dots" pad="112px var(--gutter)" gap="24px">
  <h2>Ready to decide? Our model says <em>maybe</em>.</h2>
  <Install />
</Section>

<style>
  small { font-size: 13px; color: var(--muted); }
  pre { padding: 18px 16px; font-size: 12.5px; }
  pre.card { align-self: stretch; padding: 16px; border-radius: 10px; font-size: 13.5px; }

  .hero { display: flex; flex-direction: column; gap: 22px; }
  h1 { font-size: clamp(48px, 6.6vw, 86px); line-height: 0.98; letter-spacing: -0.055em; }
  h1 + p { color: var(--ink-2); font-size: clamp(22px, 2.4vw, 28px); line-height: 1.25; font-weight: 500; letter-spacing: -0.02em; }
  h1 + p em { font-family: var(--serif); font-weight: 400; font-size: 1.12em; }
  h1 + p + p { font-size: 18px; line-height: 1.55; max-width: 540px; }
  h1 + p + p + p { display: flex; flex-wrap: wrap; gap: 12px; }
  .hero ul { display: flex; flex-wrap: wrap; gap: 6px; font-family: var(--mono); font-size: 11px; line-height: 1; }
  .hero li { display: inline-flex; border-radius: 4px; overflow: hidden; color: #fff; }
  .hero li span { padding: 5px 7px; }
  .hero li span:first-child { background: var(--grey); color: var(--ink-2); }

  .dashboard { border-radius: 16px; box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.02); }
  .dashboard header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid var(--line); font-size: 13px; }
  .dashboard header span:first-child { color: var(--ink); font-weight: 500; }
  .dashboard header span:last-child { display: inline-flex; align-items: center; gap: 6px; color: var(--ok); }
  .dashboard header span:last-child::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--live); }
  .dashboard dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-bottom: 1px solid var(--line); }
  .dashboard dl div { padding: 18px 20px; }
  .dashboard dl div + div { border-left: 1px solid var(--line); }
  .dashboard dt { font-size: 12.5px; color: var(--muted); }
  .dashboard dd { color: var(--ink); font-size: 26px; font-weight: 500; letter-spacing: -0.03em; }
  .dashboard p { height: 110px; padding: 20px; display: flex; align-items: end; gap: 6px; border-bottom: 1px solid var(--line); }
  .dashboard i { flex: 1; background: #1d2a33; border-radius: 2px; }
  .dashboard i:last-child { background: var(--accent); }
  table { font-size: 13.5px; }
  caption { text-align: left; padding: 14px 20px 6px; font-size: 12.5px; font-weight: 500; color: var(--ink); }
  tr { border-top: 1px solid rgba(255, 255, 255, 0.06); }
  td { padding: 10px 20px; }
  td:first-child { font-family: var(--mono); font-size: 12.5px; color: var(--ink-2); }
  td:last-child { text-align: right; }
  span[data-verdict] { border-radius: 999px; padding: 2px 10px; font-size: 12px; background: var(--grey); color: var(--soft); }
  span[data-verdict='yes'] { background: rgba(46, 160, 67, 0.18); color: #8ee6ae; }
  span[data-verdict='no'] { background: rgba(248, 81, 73, 0.16); color: #ffa198; }
  span[data-verdict='maybe'] { background: rgba(251, 191, 36, 0.14); color: #fcd34d; }

  .logos { display: flex; flex-direction: column; gap: 22px; text-align: center; }
  .logos figcaption { font-size: 13px; color: var(--muted); }
  .logos ul { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 20px 48px; color: #9ea2a9; font-size: 20px; }

  .diff { padding: 12px 0; color: var(--soft); font-size: 13.5px; }
  .diff > span { display: block; padding: 0 16px; }
  .diff span span { color: var(--muted); user-select: none; }
  .diff [data-op='-'] { background: rgba(248, 81, 73, 0.14); color: #ffa198; }
  .diff [data-op='+'] { background: rgba(46, 160, 67, 0.18); color: #8ee6ae; }
  .diff + p { padding: 12px 16px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
  .diff + p code { color: var(--soft); }

  .bias { padding: 24px; display: flex; flex-direction: column; gap: 14px; border-radius: 14px; font-size: 13.5px; }
  .bias h3 { font-size: 15px; }
  .bias ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
  .bias li { padding: 10px 12px; border: 1px solid var(--edge); border-radius: 8px; }
  .bias li[aria-current] { padding: 9px 11px; border: 2px solid var(--accent); color: var(--ink); font-weight: 500; }
  hr { width: 100%; margin: 0; border: 0; border-top: 1px solid var(--line); }

  .facts { border-radius: 14px; font-size: 14px; }

  .feature { padding: 24px; display: flex; flex-direction: column; gap: 10px; border-color: var(--line); }
  .feature strong { font-size: 32px; line-height: 1.3; color: var(--ink); font-weight: 500; letter-spacing: -0.04em; }
  .feature code { font-size: 13px; color: var(--accent); }
  .feature p { font-size: 14.5px; }

  .timeline { border-left: 1px solid rgba(255, 255, 255, 0.12); }
  .timeline li { position: relative; padding: 0 0 32px 28px; }
  .timeline li:last-child { padding-bottom: 0; }
  .timeline li::before { content: ''; position: absolute; left: -5px; top: 7px; width: 9px; height: 9px; border-radius: 50%; background: var(--bar); }
  .timeline li[data-dot='latest']::before { background: var(--accent); }
  .timeline li[data-dot='major']::before { background: var(--ink); }
  .timeline p:first-child { display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline; }
  .timeline p:first-child code { color: var(--ink); font-weight: 500; }
  .timeline mark { background: var(--ink); }
  .timeline p + p { margin-top: 6px; font-size: 15px; }
  .timeline p + p :global(code) { color: var(--ink-2); }

  .model-card { border-radius: 14px; font-size: 15px; line-height: 1.5; }
  .model-card header { padding: 22px 26px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 14px 12px; border-bottom: 1px solid var(--line); }
  .model-card h3 { font-family: var(--mono); font-size: 18px; }
  .model-card ul { flex-basis: 100%; display: flex; flex-wrap: wrap; gap: 8px; font-family: var(--mono); font-size: 12px; }
  .model-card li { padding: 3px 8px; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 6px; color: var(--soft); }

  .chart { padding: 28px; display: flex; flex-direction: column; gap: 18px; font-size: 13px; }
  .chart:first-child { overflow: visible; }
  .chart figcaption { display: flex; flex-direction: column; gap: 4px; color: var(--ink); font-size: 16px; font-weight: 500; }
  .chart figcaption small { font-weight: 400; }
  .chart > small { margin-top: auto; font-size: 12.5px; }
  .chart i { display: block; background: var(--bar); border-radius: 3px; }
  .chart [data-ours] { color: var(--ink); }
  .chart [data-ours] i { background: var(--accent); }
  .chart ul { display: flex; flex-direction: column; gap: 18px; }
  .chart ul li { display: flex; flex-direction: column; gap: 6px; }
  .chart ul i { height: 12px; }
  .chart ol { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: 220px auto; gap: 14px; text-align: center; font-size: 12px; color: var(--muted); }
  .chart ol li { display: grid; grid-row: span 2; grid-template-rows: subgrid; gap: 14px; }
  .chart ol span { display: flex; flex-direction: column; gap: 8px; justify-content: end; font-size: 13px; color: var(--text); }
  .chart ol [data-ours] span { color: var(--ink); font-weight: 500; }
  .chart ol i { border-radius: 3px 3px 0 0; }

  .counters { display: flex; flex-wrap: wrap; gap: 40px; margin-top: 8px; }
  .counters div { display: flex; flex-direction: column-reverse; }
  .counters dd { color: var(--ink); font-size: 56px; font-weight: 500; letter-spacing: -0.05em; line-height: 1; }
  .counters dt { margin-top: 8px; font-size: 13px; color: var(--muted); }

  .license { display: flex; flex-wrap: wrap; gap: 32px 56px; }
  .license > :global(:first-child) { flex: 1 1 300px; }
  .license pre { flex: 999 1 560px; min-width: 0; padding: 28px; border-radius: 12px; font-size: 13px; white-space: pre-wrap; }

  .quote { height: 100%; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; gap: 20px; border-color: var(--line); }
  blockquote { color: var(--ink-2); font-size: 15.5px; quotes: '“' '”'; }
  blockquote::before { content: open-quote; }
  blockquote::after { content: close-quote; }
  .quote figcaption { display: flex; gap: 12px; align-items: center; font-size: 13.5px; }
  .quote i { flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--grey); color: var(--ink-2); font-style: normal; font-weight: 600; font-size: 13px; }
  .quote b { display: block; color: var(--ink); font-weight: 400; }

  .tier { padding: 28px; display: flex; flex-direction: column; gap: 18px; border-radius: 14px; font-size: 14px; }
  .tier[aria-current] { border-color: var(--accent); background: #111316; }
  .tier h3 { display: flex; justify-content: space-between; align-items: center; font-size: 16px; }
  .tier mark { font-size: 12px; padding: 2px 10px; }
  .tier strong { color: var(--ink); font-size: 44px; font-weight: 500; letter-spacing: -0.04em; }
  .tier ul { display: flex; flex-direction: column; gap: 10px; font-size: 14.5px; }
  .tier .button { margin-top: auto; padding: 11px; border-radius: 9px; font-size: 14px; }

  details { padding: 18px 0; border-bottom: 1px solid var(--line); }
  details:first-child { border-top: 1px solid var(--line); }
  summary { min-height: 28px; display: flex; justify-content: space-between; gap: 16px; color: var(--ink); font-weight: 500; }
  summary::after { content: '+'; color: var(--muted); }
  details[open] summary::after { content: '−'; }
  details p { margin-top: 12px; }

  /* closing call to action */
  h2 { align-self: center; max-width: 760px; text-align: center; font-size: clamp(36px, 5vw, 60px); line-height: 1.05; letter-spacing: -0.05em; }
  h2 + :global(div) { align-self: center; }
</style>
