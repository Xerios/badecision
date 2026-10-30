# packages/website: the demo site

SvelteKit, built as a fully static site (`@sveltejs/adapter-static`), over `@badecision/core` (workspace link).

## Layout
- `vite.config.js`: the `sveltekit({ adapter })` plugin (SvelteKit 3 has no `svelte.config.js`), adapter-static output to
  `dist/` (the root `build:website` script expects `packages/website/dist`), dev port 5173.
- `package.json` `imports`: `#lib/*` → `src/lib/*`. SvelteKit 3 removed `$lib`; import as `#lib/...`.
- `src/app.html`: HTML shell.
- `src/routes/+layout.js`: `prerender = true`, `ssr = false`. The core loads the model client-side (`import.meta.url` asset
  URLs, `fetch`), so nothing here may run on the server. Keep SSR off.
- `src/routes/+layout.svelte`: imports `src/style.css`; header, announcement banner, `<main>`, footer (inline markup).
- `src/routes/+page.svelte`: the landing page. Each band is a `Section`; one-off markup and its styles live here.
- `src/lib/blocks/`: reusable layout blocks only. `Section` (band + centred column, optional Intro header from props),
  `Split` (Intro beside a visual, `flip`, `more` snippet under the intro), `Columns` (auto-fit grid).
- `src/lib/components/`: reused pieces: `Intro` (eyebrow, h2, lede, check list, note), `Window` (card with a file-name
  bar), `Facts` (label/value rows), `Table`, `Install`, `Icon` (paths in `src/lib/icons.js`), and `Playground` (the live
  demo, runs the real tiny model from `@badecision/core`).
- `src/lib/content.js`: list-like copy as JS objects (testimonials, FAQ, API reference, pricing, …). One-off headings and
  paragraphs stay inline in the page. `src/lib/snippets.js`: code samples and the license text. Strings rendered with
  `rich()` (`src/lib/text.js`) support `` `code` `` and `*emphasis*`.
- `src/style.css`: tokens, element defaults, and the only shared classes: `card`, `button`/`primary`, and the syntax
  classes `k s c f n`. Don't add a component for something used once; prefer element and attribute selectors to classes.
- `src/Main.dc.html`: the design reference for the landing page. Not part of the build.

## Rules
- Svelte 5 with runes (`$state`, `$derived`, `$effect`). Use `$state.raw` for the decider/model (large typed arrays).
- Static only: no `+server.js`, no form actions, no server `load`. Any new route needs `prerender` (inherited from the layout).
- `@badecision/core` is served unbundled from the workspace; do not import `node:` modules or `load.js` in site code.
- Dev dependencies: `@sveltejs/kit`, `@sveltejs/adapter-static`, `@sveltejs/vite-plugin-svelte`, `svelte`, `vite`.
  No Preact.
- Prettier config is in `.prettierrc` (no semicolons, single quotes, width 160).

## Commands
```bash
pnpm dev        # http://localhost:5173/
pnpm build      # static output in dist/
pnpm preview    # serve dist/
```
