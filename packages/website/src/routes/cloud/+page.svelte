<script>
  import Section from '#lib/blocks/Section.svelte'
  import Split from '#lib/blocks/Split.svelte'
  import Window from '#lib/components/Window.svelte'
  import AnimationPlayer from '#lib/hero/AnimationPlayer.svelte'
  import { cloud } from '#lib/snippets.js'
  import { highlight } from '#lib/text.js'
</script>

<svelte:head>
  <title>Cloud · BAdecision</title>
  <meta name="description" content="BAdecision Cloud: decisions as a service, now with the service. Adjustable astrological influence, an SLA and artificial latency." />
</svelte:head>

<Section id="cloud" label="Cloud" tone="dots" line={false} pad="clamp(48px, 7vw, 96px) var(--gutter)">
  <Split
    min="460px"
    gap="48px"
    eyebrow="Cloud"
    title="BAdecision Cloud. Decisions as a service, now with the service."
    text="Everything in the npm package, running on a computer you will never see. The cloud-hosted version unlocks the one setting the package keeps fixed, and adds a hosted API, so there is finally something to meter."
    list={[
      'Adjustable astrological influence, from 0 to 1',
      'An SLA: Should Likely Answer',
      'A dedicated astrologer, on call during retrogrades',
      '[Artificial latency](#enterprise), for enterprise trust',
    ]}
    note="Launch date: `isIt('Will BAdecision Cloud launch this year?')` currently says `'maybe'`. Talk to sales; sales will ask the model."
  >
    {#snippet more()}<a class="more" href="#observability">Show the Cloud UI <span aria-hidden="true">›</span></a>{/snippet}
    <Window title="cloud.js" aside="private beta" tone="live"><pre>{@html highlight(cloud)}</pre></Window>
  </Split>
</Section>

<Section
  id="observability"
  tone="alt"
  eyebrow="Observability"
  title="Production-grade vibes. On-device."
  text="A dashboard for a service that does not exist, watching decisions that never leave your machine. When Mercury goes retrograde, auto-remediation turns on Opposite Day and closes the incident before anyone is paged."
>
  <AnimationPlayer variant="live" />
</Section>

<Section id="enterprise" label="Enterprise">
  <Split
    flip
    eyebrow="Enterprise"
    title="Now with artificial latency."
    text="Users do not trust answers this fast, so Enterprise mode takes five seconds to say the same yes. Coming to BAdecision Cloud."
  >
    <AnimationPlayer variant="premium" />
  </Split>
</Section>

<Section label="Get started" tone="dots" pad="96px var(--gutter)" gap="24px">
  <h2>Can't wait for the cloud? Our model says <em>maybe</em>.</h2>
  <p>
    <a class="button primary" href="/#get-started">Use the npm package <span aria-hidden="true">›</span></a>
    <a class="button" href="/#pricing">See pricing</a>
  </p>
</Section>

<style>
  pre {
    padding: 18px 16px;
    font-size: 12.5px;
  }
  .more {
    font-weight: 500;
  }
  h2 {
    align-self: center;
    max-width: 760px;
    text-align: center;
    font-size: clamp(36px, 5vw, 60px);
    line-height: 1.05;
    letter-spacing: -0.05em;
  }
  p {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }
</style>
