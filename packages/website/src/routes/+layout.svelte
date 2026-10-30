<script>
  import '../style.css'
  import Icon from '#lib/components/Icon.svelte'
  import { nav, footer } from '#lib/content.js'

  let { children } = $props()
</script>

<header>
  <nav aria-label="Main">
    <a href="#top">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <rect x="0.75" y="0.75" width="20.5" height="20.5" rx="5" fill="none" stroke="currentColor" stroke-width="1.5" />
        <path d="M6 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="11" cy="6.5" r="1.4" fill="var(--accent)" />
        <circle cx="11" cy="15.5" r="1.4" fill="var(--accent)" />
      </svg>
      BAdecision
    </a>
    <ul>
      {#each nav as [label, href]}<li><a {href}>{label}</a></li>{/each}
    </ul>
    <div>
      <a href="#github"><Icon name="star" size={14} stroke={1.8} />Star · 4</a>
      <a class="button primary" href="#install">Get started</a>
    </div>
  </nav>
</header>

<a href="#changelog">
  <span>
    <mark>New</mark>
    <span>BAdecision 2.0 is here, with <code>seriously</code> for the decisions that matter. 2.0.1 adds <code>StringToBooleanFactory</code>.</span>
    <span aria-hidden="true">Read the changelog →</span>
  </span>
</a>

<main>{@render children()}</main>

<footer>
  <div>
    <nav aria-label="Footer">
      {#each footer.columns as [title, links]}
        <ul>
          <li>{title}</li>
          {#each links as [label, href]}<li><a {href}>{label}</a></li>{/each}
        </ul>
      {/each}
    </nav>
    <ol>
      {#each footer.footnotes as note}<li>{note}</li>{/each}
    </ol>
    <p><span>All systems nominal</span><span>BAdecision · Balanced Assessment Decisions · v2.0.1 · ©2026 · Hand-written by AI</span></p>
    <small>BAdecision is a parody. It is not affiliated with any company or model mentioned on this site. Testimonials are fictional, including the ones from real AI agents.</small>
  </div>
</footer>

<style>
  header { position: sticky; top: 0; z-index: 10; background: rgba(8, 9, 10, 0.88); backdrop-filter: blur(12px); border-bottom: 1px solid var(--line); }
  header nav { max-width: 1160px; min-height: 60px; margin: 0 auto; padding: 10px var(--gutter); display: flex; flex-wrap: wrap; align-items: center; gap: 10px 28px; }
  header nav > a { display: flex; align-items: center; gap: 10px; color: var(--ink); font-weight: 600; font-size: 17px; letter-spacing: -0.03em; }
  header ul { flex: 1 1 auto; display: flex; flex-wrap: wrap; gap: 4px 22px; font-size: 14px; }
  header div { display: flex; align-items: center; gap: 10px; }
  header div a { min-height: 36px; padding: 6px 10px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--edge); border-radius: 8px; font-size: 13px; }
  header .button { padding: 8px 14px; font-size: 14px; }

  /* announcement banner */
  header + a { display: block; border-bottom: 1px solid var(--line); background: linear-gradient(90deg, rgba(125, 211, 252, 0.06), rgba(125, 211, 252, 0.12), rgba(125, 211, 252, 0.06)); }
  header + a > span { max-width: 1160px; min-height: 44px; margin: 0 auto; padding: 10px var(--gutter); display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px 12px; font-size: 13.5px; color: var(--ink-2); text-align: center; }
  header + a mark { font-size: 12px; padding: 2px 9px; }
  header + a code { color: var(--ink); }
  header + a span span:last-child { color: var(--muted); }

  footer { border-top: 1px solid var(--line); font-size: 14px; }
  footer > div { max-width: 1160px; margin: 0 auto; padding: 64px var(--gutter) 40px; display: flex; flex-direction: column; gap: 48px; }
  footer nav { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); gap: 32px; }
  footer ul { display: flex; flex-direction: column; gap: 10px; }
  footer ul li:first-child { color: var(--ink); font-weight: 500; }
  footer ol { padding-left: 18px; list-style: decimal; display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; color: var(--muted); }
  footer p { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; padding-top: 24px; border-top: 1px solid var(--line); font-size: 13px; color: var(--muted); }
  footer p span:first-child { display: inline-flex; align-items: center; gap: 8px; }
  footer p span:first-child::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--live); }
  footer small { font-size: 12px; color: var(--muted); }
</style>
