<!-- A use case: its animation, large (`grow`), beside a narrow Intro on wide screens and under it on small ones.
     `variant` is the animation and the anchor id; flip puts the text on the right. Other props go to the Intro. -->
<script>
  import Intro from '#lib/components/Intro.svelte'
  import AnimationPlayer from '#lib/hero/AnimationPlayer.svelte'

  let { variant, flip = false, ...intro } = $props()
</script>

<div id={variant} class:flip>
  <Intro {...intro} small />
  <AnimationPlayer {variant} grow />
</div>

<style>
  div {
    display: grid;
    gap: 28px 56px;
    align-items: center;
  }
  @media (min-width: 1000px) {
    div {
      grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
    }
    .flip {
      grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
    }
    .flip > :global(:first-child) {
      order: 2;
    }
  }
</style>
