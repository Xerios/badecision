<script>
  import { page } from '$app/state'
  import Section from '#lib/blocks/Section.svelte'
  import Split from '#lib/blocks/Split.svelte'
  import Columns from '#lib/blocks/Columns.svelte'
  import UseCase from '#lib/blocks/UseCase.svelte'
  import Intro from '#lib/components/Intro.svelte'
  import Window from '#lib/components/Window.svelte'
  import Facts from '#lib/components/Facts.svelte'
  import Table from '#lib/components/Table.svelte'
  import Install from '#lib/components/Install.svelte'
  import Playground from '#lib/components/Playground.svelte'
  import AnimationPlayer from '#lib/hero/AnimationPlayer.svelte'
  import { api, modelCard, benchmarks, usecases } from '#lib/content.js'
  import { examples, test, license } from '#lib/snippets.js'
  import { highlight } from '#lib/text.js'

  // the API section's example tab
  let tab = $state(0)

  // the license, one block per paragraph; numbered sections get an id (#license-<n>) for the links in pricing and the FAQ
  const licenseParts = license.split('\n\n').map(text => ({ text, n: text.match(/^(\d+)\./)?.[1] }))
  // the linked section is highlighted. Not :target, which client-side navigation doesn't update
  const linked = $derived(page.url.hash.slice(1))
</script>

<Section
  id="developers"
  tone="dots"
  line={false}
  title="Developers"
  text="The technical parts: try it live, read the API, inspect the model and its one test, and accept the license, or don't."
  pad="clamp(48px, 7vw, 96px) var(--gutter) 64px"
>
  <Install id="install" />
</Section>

<Section id="playground" label="Playground">
  <Playground />
</Section>

<Section tone="alt" label={usecases.thinking.eyebrow} width="1440px" pad="clamp(48px, 6vw, 80px) var(--gutter)">
  <UseCase variant="thinking" {...usecases.thinking} />
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

<Section tone="alt" label={usecases.ship.eyebrow} width="1440px" pad="clamp(48px, 6vw, 80px) var(--gutter)">
  <UseCase variant="ship" flip {...usecases.ship} />
</Section>

<Section id="model-card" eyebrow="Model card" title="Everything you need to know">
  <AnimationPlayer variant="fridge" />
  <article class="card model-card">
    <header>
      <h3>badecision/balanced-assessment-decisions-2.0.3</h3>
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
  tone="alt"
  eyebrow="Benchmarks"
  title="Independently benchmarked by benchmarks."
  text="Evaluated on SomeBench and TrustMeBench, two industry benchmarks we are confident exist.³"
>
  <AnimationPlayer variant="sprint" />
  <Table caption="How we compare" {...benchmarks.compare} highlight={1} rowHeaders minWidth="720px" />
</Section>

<Section label={usecases.race.eyebrow} width="1440px" pad="clamp(48px, 6vw, 80px) var(--gutter)">
  <UseCase variant="race" {...usecases.race} />
</Section>

<Section tone="alt" id="quality" label="Quality">
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

<Section label={usecases.reliable.eyebrow} width="1440px" pad="clamp(48px, 6vw, 80px) var(--gutter)">
  <UseCase variant="reliable" flip {...usecases.reliable} />
</Section>

<Section id="license" label="License">
  <div class="license">
    <Intro
      eyebrow="License"
      title="Licensing"
      text="We believe research should be open. We also believe it should be ours. The BAdecision Public Private License (BPPL-1.0) reflects both positions without favoring either."
      note="The `license` field in `package.json` reads `MIT AND UNLICENSED`. npm accepts this."
    />
    <pre class="card">{#each licenseParts as { text, n }, i}{i ? '\n\n' : ''}<span id={n && `license-${n}`} data-linked={(n && linked === `license-${n}`) || null}>{text}</span>{/each}</pre>
  </div>
</Section>

<style>
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
  .facts {
    border-radius: 14px;
    font-size: 14px;
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
  .license [data-linked] {
    color: var(--ink);
    background: rgba(125, 211, 252, 0.12);
    box-shadow: 0 0 0 6px rgba(125, 211, 252, 0.12);
    border-radius: 2px;
  }
</style>
