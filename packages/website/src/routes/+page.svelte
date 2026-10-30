<script>
  import Section from '#lib/blocks/Section.svelte'
  import Split from '#lib/blocks/Split.svelte'
  import Columns from '#lib/blocks/Columns.svelte'
  import UseCase from '#lib/blocks/UseCase.svelte'
  import Window from '#lib/components/Window.svelte'
  import Install from '#lib/components/Install.svelte'
  import AnimationPlayer from '#lib/hero/AnimationPlayer.svelte'
  import { badges, customers, features, usecases, tiers, faq } from '#lib/content.js'
  import { refundsDiff } from '#lib/snippets.js'
  import { rich } from '#lib/text.js'
</script>

<svelte:head>
  <title>BAdecision: Balanced Assessment Decisions</title>
  <meta name="description" content="Decisions as a service, without the service. Yes, no, maybe or not sure, on-device, with a little help from the stars." />
</svelte:head>

<Section label="BAdecision" tone="dots" line={false} pad="clamp(32px, 5vw, 56px) var(--gutter) 96px" gap="48px">
  <AnimationPlayer variant="cosmos" />
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
        <a class="button primary" href="#start">Start now <span aria-hidden="true">›</span></a>
        <a class="button" href="#pricing">Contact sales <span aria-hidden="true">›</span></a>
      </p>
      <Install id="install" />
      <ul aria-label="Badges">
        {#each badges as [label, value, color]}<li><span>{label}</span><span style:background={color}>{value}</span></li>{/each}
      </ul>
    </div>
  </Columns>
</Section>

<Section label="Customers" line={false} pad="48px var(--gutter)">
  <figure class="logos">
    <figcaption>Trusted by teams at</figcaption>
    <ul>
      {#each customers as [name, style]}<li {style}>{name}</li>{/each}
    </ul>
  </figure>
</Section>

{#snippet usecase(variant, tone, flip, id = null)}
  <Section {id} label={usecases[variant].eyebrow} {tone} width="1440px" pad="clamp(48px, 6vw, 80px) var(--gutter)" title={null} text={null} small>
    <UseCase {variant} {flip} {...usecases[variant]} />
  </Section>
{/snippet}

{@render usecase('cookie', 'alt', true, 'usecases')}

{@render usecase('captcha', null, false)}

{@render usecase('fluent', 'alt', true)}

<Section id="product" label="Product" pad="104px var(--gutter)">
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
        A yes is the string <code>'true'</code>, a no is a real <code>false</code>, and maybe is <code>null</code>. Need a strict boolean? Use
        <code>isItFalse()</code>.
      </p>
    </Window>
  </Split>
</Section>

<Section id="features" tone="alt" title="Everything you need. Nothing you'd expect." small line={false} gap="32px">
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

<Section id="governance" label="Governance" pad="104px var(--gutter)">
  <Split
    flip
    eyebrow="Governance"
    title="Bias you can audit, configure and blame."
    text="Every model is biased. Most vendors hide it. BAdecision derives its bias from the sign (or birthday) you configure and today's sky, and when a daily omen matches the question, the omen wins. Influence is fixed at a cosmically balanced 0.5; adjusting it requires the [cloud-hosted version](/cloud)."
    note="Compliance note: every January 25 is Opposite Day. Yes means no. This cannot be disabled."
  >
    <AnimationPlayer variant="orrery" />
  </Split>
</Section>

{@render usecase('channel', 'alt', true)}
{@render usecase('standup', null, false)}
{@render usecase('swipe', 'alt', true)}

<Section id="pricing" tone="alt" title="Simple, transparent pricing." text="It runs on your machine, so there is nothing to meter." center>
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
  <small style:text-align="center"
    >Rate limits: none. Usage-based billing: none. The <a href="/cloud">cloud-hosted version</a> has no launch date, so its price is accurate.</small
  >
</Section>

<Section id="get-started" label="Get started" tone="dots" pad="112px var(--gutter)" gap="24px">
  <h2>You made the right <em>decision</em> choosing the BAdecision.</h2>
  <AnimationPlayer variant="typo" />
  <p class="convince">Still not convinced? <a href="/developers#thinking">Check out more juicy details <span aria-hidden="true">›</span></a></p>
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

<style>
  small {
    font-size: 13px;
    color: var(--muted);
  }
  pre {
    padding: 18px 16px;
    font-size: 12.5px;
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
  h1 + p em,
  h2 em {
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
