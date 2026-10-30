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
  import AnimationPlayer from '#lib/hero/AnimationPlayer.svelte'
  import { badges, customers, features, api, modelCard, benchmarks, testimonials, tiers, faq } from '#lib/content.js'
  import { examples, test, cloud, license, refundsDiff } from '#lib/snippets.js'
  import { highlight, rich } from '#lib/text.js'

  const initials = name =>
    name
      .split(/[\s-]+/)
      .slice(0, 2)
      .map(w => w[0])
      .join('')

  // the API section's example tab
  let tab = $state(0)

  // the license, one block per paragraph; numbered sections get an id (#license-<n>) for the links in pricing and the FAQ
  const licenseParts = license.split('\n\n').map(text => ({ text, n: text.match(/^(\d+)\./)?.[1] }))
</script>

<svelte:head>
  <title>BAdecision: Balanced Assessment Decisions</title>
  <meta name="description" content="Decisions as a service, without the service. Yes, no, maybe or not sure, on-device, with a little help from the stars." />
</svelte:head>

<Section label="BAdecision" tone="dots" line={false} pad="clamp(32px, 5vw, 56px) var(--gutter) 96px" gap="48px">
  <AnimationPlayer variant="cosmos" controls />
  <Columns min="440px" align="start">
    <div class="hero">
      <h1>Ballanced Assessment Decisions</h1>
      <p>The <em>decision</em> infrastructure for the modern enterprise.</p>
    </div>
    <div class="hero">
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
  </Columns>
</Section>

<Section label="Customers" line={false} pad="48px var(--gutter)">
  <figure class="logos">
    <figcaption>Trusted by teams who did not ask</figcaption>
    <ul>
      {#each customers as [name, style]}<li {style}>{name}</li>{/each}
    </ul>
  </figure>
</Section>

<Section label="Playground" pad="72px var(--gutter) 24px">
  <Playground />
</Section>

<Section id="product" label="Product" tone="alt" pad="104px var(--gutter)" gap="112px">
  <Split
    eyebrow="Embed"
    title="Modernize legacy boolean logic in a single line."
    text="Conditionals that evaluate to true or false are a source of rigidity across the enterprise. BAdecision replaces them with outcomes that reflect the real world: 'true', false or null. Only a yes is truthy."
    list={['Runs in Node, Deno, Bun and the browser', 'Per-tenant isolation with create({ sign })', 'Strict mode for regulated workloads (isItTrueStrict)']}
  >
    <Window title="src/refunds.js">
      <pre class="diff">{#each refundsDiff as [n, op, code]}<span data-op={op}><span>{String(n).padStart(4)} {op === '-' ? '−' : op || ' '} </span>{code}</span
          >{/each}</pre>
      <p>
        A yes is the string <code>'true'</code>, a no is a real <code>false</code>, and maybe is <code>null</code>: a boolean that is sometimes a string, and
        occasionally not a boolean at all.
      </p>
    </Window>
  </Split>

  <Split
    flip
    eyebrow="Governance"
    title="Bias you can audit, configure and blame."
    text="Every model is biased. Most vendors hide it. BAdecision derives its bias from the sign (or birthday) you configure and today's sky, and when a daily omen matches the question, the omen wins. Influence is fixed at a cosmically balanced 0.5; adjusting it requires the [cloud-hosted version](#cloud)."
    note="Compliance note: every January 25 is [Opposite Day](/usecases#opposite). Yes means no. This cannot be disabled."
  >
    <AnimationPlayer variant="orrery" />
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
  <a class="more" href="/usecases">See the use cases <span aria-hidden="true">›</span></a>
</Section>

<Section
  id="observability"
  tone="alt"
  eyebrow="Observability"
  title="Production-grade vibes. On-device."
  text="A dashboard for a service that does not exist, watching decisions that never leave your machine. When Mercury goes retrograde, auto-remediation turns on [Opposite Day](/usecases#opposite) and closes the incident before anyone is paged."
>
  <AnimationPlayer variant="live" />
  <a class="more" href="#cloud">More info on Cloud <span aria-hidden="true">›</span></a>
</Section>

<Section
  id="api"
  eyebrow="API"
  title="A small API surface. Smaller than it looks."
  text="Every function takes a plain string. Every function is synchronous, except the serious ones. Every function consults the model and the stars, including the ones that don't need to."
>
  <Columns min="460px" gap="20px" align="start">
    <div class="examples">
      <div role="group" aria-label="Examples">
        {#each examples as [label], i}<button type="button" aria-pressed={tab === i} onclick={() => (tab = i)}>{label}</button>{/each}
      </div>
      <Window title={examples[tab][1]}><pre>{@html highlight(examples[tab][2])}</pre></Window>
    </div>
    <div class="card facts"><Facts rows={api.filter(r => r.tabs.includes(examples[tab][0]))} labelWidth="180px" pad="14px 18px" /></div>
  </Columns>
</Section>

<Section id="model-card" tone="alt" eyebrow="Model card" title="Everything you need to know">
  <AnimationPlayer variant="fridge" />
  <article class="card model-card">
    <header>
      <h3>badecision/balanced-assessment-decisions-2.0.2</h3>
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
  eyebrow="Benchmarks"
  title="Independently benchmarked by benchmarks."
  text="Evaluated on SomeBench and TrustMeBench, two industry benchmarks we are confident exist.³"
>
  <AnimationPlayer variant="sprint" />
  <Table caption="How we compare" {...benchmarks.compare} highlight={1} rowHeaders minWidth="720px" />
</Section>

<Section id="quality" label="Quality" tone="alt">
  <Split
    min="460px"
    gap="48px"
    align="start"
    eyebrow="Quality"
    title="One test. 100% coverage. Zero bugs."
    text="The test suite consists of one test, with 100% line, branch and function coverage of the package source. Every line of it was personally hand-written by AI."
  >
    {#snippet more()}
      <dl class="counters">
        <div>
          <dt>coverage²</dt>
          <dd>100%</dd>
        </div>
        <div>
          <dt>test</dt>
          <dd>1</dd>
        </div>
        <div>
          <dt>open issues¹</dt>
          <dd>0</dd>
        </div>
      </dl>
    {/snippet}
    <Window title="test/index.test.js" aside="✓ 1 passed" tone="ok"><pre>{@html highlight(test)}</pre></Window>
  </Split>
</Section>

<Section id="cloud" label="Cloud">
  <Split
    min="460px"
    gap="48px"
    eyebrow="Cloud"
    title="BAdecision Cloud. Decisions as a service, now with the service."
    text="Everything in the npm package, running on a computer you will never see. The cloud-hosted version unlocks the one setting the package keeps fixed, and adds an API, so there is finally something to meter."
    list={[
      'Adjustable astrological influence, from 0 to 1',
      'An SLA: Should Likely Answer',
      'A dedicated astrologer, on call during retrogrades',
      '[Artificial latency](/usecases#premium), for enterprise trust',
    ]}
    note="Launch date: `isIt('Will BAdecision Cloud launch this year?')` currently says `'maybe'`. Talk to sales; sales will ask the model."
  >
    {#snippet more()}<a class="more" href="#observability" style:align-self="flex-start">Show the Cloud UI <span aria-hidden="true">›</span></a>{/snippet}
    <Window title="cloud.js" aside="private beta" tone="live"><pre>{@html highlight(cloud)}</pre></Window>
  </Split>
</Section>

<Section id="license" label="License" tone="alt">
  <div class="license">
    <Intro
      eyebrow="License"
      title="Licensing"
      text="We believe research should be open. We also believe it should be ours. The BAdecision Public Private License (BPPL-1.0) reflects both positions without favoring either."
      note="The `license` field in `package.json` reads `MIT AND UNLICENSED`. npm accepts this."
    />
    <pre class="card">{#each licenseParts as { text, n }, i}{i ? '\n\n' : ''}<span id={n && `license-${n}`}>{text}</span>{/each}</pre>
  </div>
</Section>

<Section id="testimonials" title="Loved by engineers, human and agent." small>
  <AnimationPlayer variant="community" />
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

<Section id="pricing" tone="alt" title="Simple, transparent pricing." text="There is no API, so there is nothing to meter." center>
  <Columns min="290px" gap="12px" align="stretch">
    {#each tiers as tier}
      <article class="card tier" aria-current={tier.badge ? true : null}>
        <h3>
          {tier.name}{#if tier.badge}<mark>{tier.badge}</mark>{/if}
        </h3>
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

<Section id="get-started" label="Get started" tone="dots" pad="112px var(--gutter)" gap="24px">
  <h2>You made the right <em>decision</em> choosing the BAdecision.</h2>
  <AnimationPlayer variant="typo" />
  <p class="convince">Still not convinced? <a href="/usecases">Check out our use-case videos <span aria-hidden="true">›</span></a></p>
</Section>

<style>
  small {
    font-size: 13px;
    color: var(--muted);
  }
  pre {
    padding: 18px 16px;
    font-size: 12.5px;
  }
  pre.card {
    align-self: stretch;
    padding: 16px;
    border-radius: 10px;
    font-size: 13.5px;
  }

  .hero {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  h1 {
    font-size: clamp(48px, 6.6vw, 86px);
    line-height: 0.98;
    letter-spacing: -0.055em;
  }
  h1 + p {
    color: var(--ink-2);
    font-size: clamp(22px, 2.4vw, 28px);
    line-height: 1.25;
    font-weight: 500;
    letter-spacing: -0.02em;
  }
  h1 + p em {
    font-family: var(--serif);
    font-weight: 400;
    font-size: 1.12em;
  }
  .hero + .hero > p:first-child {
    font-size: 18px;
    line-height: 1.55;
    max-width: 540px;
  }
  .hero + .hero > p:nth-child(2) {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .hero ul {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-family: var(--mono);
    font-size: 11px;
    line-height: 1;
  }
  .hero li {
    display: inline-flex;
    border-radius: 4px;
    overflow: hidden;
    color: #fff;
  }
  .hero li span {
    padding: 5px 7px;
  }
  .hero li span:first-child {
    background: var(--grey);
    color: var(--ink-2);
  }

  .logos {
    display: flex;
    flex-direction: column;
    gap: 22px;
    text-align: center;
  }
  .logos figcaption {
    font-size: 13px;
    color: var(--muted);
  }
  .logos ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 20px 48px;
    color: #9ea2a9;
    font-size: 20px;
  }

  .diff {
    padding: 12px 0;
    color: var(--soft);
    font-size: 13.5px;
  }
  .diff > span {
    display: block;
    padding: 0 16px;
  }
  .diff span span {
    color: var(--muted);
    user-select: none;
  }
  .diff [data-op='-'] {
    background: rgba(248, 81, 73, 0.14);
    color: #ffa198;
  }
  .diff [data-op='+'] {
    background: rgba(46, 160, 67, 0.18);
    color: #8ee6ae;
  }
  .diff + p {
    padding: 12px 16px;
    border-top: 1px solid var(--line);
    font-size: 12.5px;
    color: var(--muted);
  }
  .diff + p code {
    color: var(--soft);
  }

  .examples {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .examples [role='group'] {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .examples button {
    min-height: 32px;
    padding: 5px 12px;
    border: 1px solid var(--edge);
    border-radius: 8px;
    background: none;
    color: var(--muted);
    font: 12.5px var(--mono);
    cursor: pointer;
  }
  .examples button:hover {
    color: var(--ink);
  }
  .examples [aria-pressed='true'] {
    border-color: var(--accent);
    color: var(--ink);
    background: var(--raised);
  }

  .more {
    align-self: center;
    font-weight: 500;
  }
  .convince {
    align-self: center;
    text-align: center;
    color: var(--muted);
  }
  .convince a {
    font-weight: 500;
  }

  .facts {
    border-radius: 14px;
    font-size: 14px;
  }

  .feature {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-color: var(--line);
  }
  .feature strong {
    font-size: 32px;
    line-height: 1.3;
    color: var(--ink);
    font-weight: 500;
    letter-spacing: -0.04em;
  }
  .feature code {
    font-size: 13px;
    color: var(--accent);
  }
  .feature p {
    font-size: 14.5px;
  }

  .model-card {
    border-radius: 14px;
    font-size: 15px;
    line-height: 1.5;
  }
  .model-card header {
    padding: 22px 26px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 14px 12px;
    border-bottom: 1px solid var(--line);
  }
  .model-card h3 {
    font-family: var(--mono);
    font-size: 18px;
  }
  .model-card ul {
    flex-basis: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-family: var(--mono);
    font-size: 12px;
  }
  .model-card li {
    padding: 3px 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    color: var(--soft);
  }

  .counters {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
    margin-top: 8px;
  }
  .counters div {
    display: flex;
    flex-direction: column-reverse;
  }
  .counters dd {
    color: var(--ink);
    font-size: 56px;
    font-weight: 500;
    letter-spacing: -0.05em;
    line-height: 1;
  }
  .counters dt {
    margin-top: 8px;
    font-size: 13px;
    color: var(--muted);
  }

  .license {
    display: flex;
    flex-wrap: wrap;
    gap: 32px 56px;
  }
  .license > :global(:first-child) {
    flex: 1 1 300px;
  }
  .license pre {
    flex: 999 1 560px;
    min-width: 0;
    padding: 28px;
    border-radius: 12px;
    font-size: 13px;
    white-space: pre-wrap;
  }
  .license span:target {
    color: var(--ink);
    background: rgba(125, 211, 252, 0.12);
    box-shadow: 0 0 0 6px rgba(125, 211, 252, 0.12);
    border-radius: 2px;
  }

  .quote {
    height: 100%;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 20px;
    border-color: var(--line);
  }
  blockquote {
    color: var(--ink-2);
    font-size: 15.5px;
    quotes: '“' '”';
  }
  blockquote::before {
    content: open-quote;
  }
  blockquote::after {
    content: close-quote;
  }
  .quote figcaption {
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 13.5px;
  }
  .quote i {
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--grey);
    color: var(--ink-2);
    font-style: normal;
    font-weight: 600;
    font-size: 13px;
  }
  .quote b {
    display: block;
    color: var(--ink);
    font-weight: 400;
  }

  .tier {
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    border-radius: 14px;
    font-size: 14px;
  }
  .tier[aria-current] {
    border-color: var(--accent);
    background: #111316;
  }
  .tier h3 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
  }
  .tier mark {
    font-size: 12px;
    padding: 2px 10px;
  }
  .tier strong {
    color: var(--ink);
    font-size: 44px;
    font-weight: 500;
    letter-spacing: -0.04em;
  }
  .tier ul {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 14.5px;
  }
  .tier .button {
    margin-top: auto;
    padding: 11px;
    border-radius: 9px;
    font-size: 14px;
  }

  details {
    padding: 18px 0;
    border-bottom: 1px solid var(--line);
  }
  details:first-child {
    border-top: 1px solid var(--line);
  }
  summary {
    min-height: 28px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    color: var(--ink);
    font-weight: 500;
  }
  summary::after {
    content: '+';
    color: var(--muted);
  }
  details[open] summary::after {
    content: '−';
  }
  details p {
    margin-top: 12px;
  }

  /* closing call to action */
  h2 {
    align-self: center;
    max-width: 760px;
    text-align: center;
    font-size: clamp(36px, 5vw, 60px);
    line-height: 1.05;
    letter-spacing: -0.05em;
  }
</style>
