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
- `src/routes/usecases/+page.svelte`: Use cases, one band per use case (`usecases` in `content.js`) with its animation
  (`grow`, a narrow text column beside it on wide screens). Each band's id is its variant key, so the landing page links
  to `/usecases#<variant>` (e.g. Opposite Day). Site-wide links (nav, footer) are absolute (`/#api`) so they work from both pages.
- `src/lib/blocks/`: reusable layout blocks only. `Section` (band + centred column, optional Intro header from props),
  `Split` (Intro beside a visual, `flip`, `more` snippet under the intro), `Columns` (auto-fit grid).
- `src/lib/components/`: reused pieces: `Intro` (eyebrow as dim text, h2, lede, check list, note), `Window` (card with a file-name
  bar), `Facts` (label/value rows), `Table`, `Install`, `Icon` (paths in `src/lib/icons.js`), and `Playground` (the live
  demo: `decide()`, `seriously.decide()` and `configure({ sign })` from `src/lib/badecision.js`; the serious
  model loads only after the user confirms the ~163 MB download).
- `src/lib/badecision.js`: the `badecision` package's default instance (sign, lucky number, `decide()` output, and
  `seriously` with the package's Cache API keys) rebuilt over `@badecision/core`, with the tiny model fetched and run in
  JS. The serious kernel is imported from `packages/badecision/kernel/smol_kernel.wasm`. Keep it in step with
  `packages/badecision/src/{config,lucky,answers,serious}.ts`.
- `src/lib/hero/`: the page's animations (anime.js). `AnimationPlayer.svelte` is the frame (800×600 stage scaled to fit;
  the variant mounts, and so starts, once the frame scrolls into view; hover Replay once ended, and it replays when scrolled fully out of view and back; `grow` lets it scale past the
  stage width (up to 80vh tall); `controls` adds the variant picker and `?hero=<key>`, hero only; the stage takes no pointer input, selection or context menu); `index.js`
  registers the variants (`size`, `bare`). Placement, one per band and never two bands in a row: hero `cosmos`,
  Governance `orrery`, Observability `live`, Model card `fridge`, Benchmarks `sprint`, Testimonials `community`, Get
  started `typo`, footer `buildingup` (in the layout). The rest are on `/usecases` and in the hero picker. A variant plays once on mount,
  holds its last frame, and takes `still` (reduced motion: jump to the end) and `onend`. Variants: `Cosmos` (copy,
  timing and geometry in `cosmos.js`), `Race`, `ShipIt`, `Orrery`, `Keynote`, `Live`, `Channel`, `Fridge`. `stage.js`
  has the shared `play()` (one timeline, started after fonts load) and easing/typing helpers. Anything procedural
  derives from the timeline's current time so it stays seekable. Give each phase a hold after its last beat.
- `src/lib/content.js`: list-like copy as JS objects (testimonials, FAQ, API reference, pricing, …). One-off headings and
  paragraphs stay inline in the page. `src/lib/snippets.js`: code samples and the license text. Strings rendered with
  `rich()` (`src/lib/text.js`) support `` `code` ``, `*emphasis*` and `[links](#anchor)`. License sections are
  rendered with ids `#license-<n>`.
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
