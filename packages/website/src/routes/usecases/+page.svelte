<script>
  import Section from '#lib/blocks/Section.svelte'
  import Intro from '#lib/components/Intro.svelte'
  import AnimationPlayer from '#lib/hero/AnimationPlayer.svelte'
  import { usecases } from '#lib/content.js'
</script>

<svelte:head>
  <title>Use cases · BAdecision</title>
  <meta name="description" content="BAdecision in the wild: Opposite Day, artificial latency, water-neutral decisions, cookie banners, standups and more." />
</svelte:head>

<Section
  id="usecases"
  tone="dots"
  line={false}
  width="1440px"
  title="Use cases"
  text="BAdecision in the wild. Every use case comes with a video, because a use case without a video is a feature request."
  pad="clamp(48px, 7vw, 96px) var(--gutter) 64px"
/>

{#each usecases as u, i}
  <Section id={u.variant} label={u.eyebrow} tone={i % 2 ? null : 'alt'} width="1440px" pad="clamp(48px, 6vw, 80px) var(--gutter)">
    <div class="usecase" class:flip={i % 2 === 1}>
      <Intro eyebrow={u.eyebrow} title={u.title} text={u.text} small />
      <AnimationPlayer variant={u.variant} grow />
    </div>
  </Section>
{/each}

<Section label="Get started" tone="dots" pad="96px var(--gutter)" gap="24px">
  <h2>Seen enough? Our model says <em>maybe</em>.</h2>
  <p><a class="button primary" href="/#get-started">Get started <span aria-hidden="true">›</span></a> <a class="button" href="/">Back to the landing page</a></p>
</Section>

<style>
  /* the video gets the room: stacked on small screens, a narrow text column beside it on wide ones */
  .usecase {
    display: grid;
    gap: 28px 56px;
    align-items: center;
  }
  @media (min-width: 1000px) {
    .usecase {
      grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
    }
    .flip {
      grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
    }
    .flip > :global(:first-child) {
      order: 2;
    }
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
