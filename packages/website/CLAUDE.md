# packages/website: the demo site

SvelteKit, built as a fully static site (`@sveltejs/adapter-static`), over `@badecision/core` (workspace link).

## Layout
- `vite.config.js`: the `sveltekit({ adapter })` plugin (SvelteKit 3 has no `svelte.config.js`), adapter-static output to
  `dist/` (the root `build:website` script expects `packages/website/dist`), dev port 5173.
- `package.json` `imports`: `#lib/*` → `src/lib/*`. SvelteKit 3 removed `$lib`; import as `#lib/...`.
- `src/app.html`: HTML shell. `%seo.head%` is filled per page by `src/hooks.server.js` (runs while prerendering and in dev).
- SEO: `src/lib/seo.js` holds each route's title and description and builds the head tags (description, canonical,
  Open Graph, Twitter, JSON-LD on `/`). With SSR off, `<svelte:head>` never reaches the static HTML, so pages don't use it;
  a new route gets an entry in `pages`. The layout updates the tags on client-side navigation. `SITE_URL` at build time
  gives the absolute URLs (canonical, og:url, `sitemap.xml`); `vite.config.js` wraps adapter-static to write
  `robots.txt` and the sitemap into `dist/`. `static/favicon.svg` is the header logo.
- `src/routes/+layout.js`: `prerender = true`, `ssr = false`. The core loads the model client-side (`import.meta.url` asset
  URLs, `fetch`), so nothing here may run on the server. Keep SSR off.
- `src/routes/+layout.svelte`: imports `src/style.css`; header (`nav` in `content.js`: Home, Cloud, Developers, GitHub; the
  current page is `aria-current`; Get started goes to `/#pricing`), announcement banner, `<main>`, footer (inline markup).
- `src/routes/+page.svelte`: the landing page, the non-technical pitch. Each band is a `Section`; one-off markup and its
  styles live in the page that uses it.
- Use cases (`usecases` in `content.js`, keyed by animation; rendered by the `UseCase` block): three bands on the landing
  page (`cookie` at `#usecases`, `fluent`, `channel`), the other four (`thinking`, `ship`, `race`, `reliable`) between the sections of
  `/developers`.
- `src/routes/developers/+page.svelte`: everything technical: install, Playground, API (example tabs filter the
  reference rows), Model card (`fridge`), Benchmarks (`sprint`), Quality and the License. License sections get ids `#license-<n>`; the linked
  one is highlighted from `page.url.hash` (`$app/state`), since `:target` doesn't follow client-side navigation.
- `src/routes/cloud/+page.svelte`: everything about the (fictional) cloud-hosted version: the Cloud intro, the
  Observability dashboard (`live`) and Enterprise artificial latency (`premium`). Links to it go to `/cloud`.
- Site-wide links (nav, footer) are absolute (`/#api`) so they work from every page.
- `src/lib/blocks/`: reusable layout blocks only. `Section` (band + centred column, optional Intro header from props),
  `Split` (Intro beside a visual, `flip`, `more` snippet under the intro), `Columns` (auto-fit grid), `UseCase`
  (a `grow` animation beside a narrow Intro, anchored by its variant).
- `src/lib/components/`: reused pieces: `Intro` (eyebrow as dim text, h2, lede, check list, note), `Window` (card with a file-name
  bar), `Facts` (label/value rows), `Table`, `Install`, `Icon` (paths in `src/lib/icons.js`), and `Playground` (the live
  demo: `decide()`, `seriously.decide()` and `configure({ sign })` from `src/lib/badecision.js`; the serious
  model loads only after the user confirms the ~163 MB download).
- `src/lib/badecision.js`: the `badecision` package's default instance (sign, lucky number, `decide()` output, and
  `seriously` with the package's Cache API keys) rebuilt over `@badecision/core`, with the tiny model fetched and run in
  JS. The serious kernel is imported from `packages/badecision/kernel/smol_kernel.wasm`. Keep it in step with
  `packages/badecision/src/{config,lucky,answers,serious}.ts`.
- `src/lib/hero/`: the page's animations (anime.js). `AnimationPlayer.svelte` is the frame (800×600 stage scaled to fit;
  the variant mounts, and so starts, at 30% on screen, plays a half-second teaser and, unless 95% is on screen by then,
  pauses until it is (stage.js announces each timeline with a bubbling `herotimeline` event; `loop()` needs `root`); hover Replay once ended, and it replays when scrolled fully out of view and half back; `grow` lets it scale past the
  stage width (up to 80vh tall); there is no variant picker; the stage takes no pointer input, selection or context menu); `index.js`
  registers the variants (`size`, `bare`). Landing placement, one per band: hero `cosmos`,
  Governance `orrery`, Get
  started `typo`, Testimonials (after the FAQ) `community`, footer `buildingup` (in the layout). `/developers` has `fridge` and `sprint`, `/cloud` has `live` and `premium`; use cases are listed above; the rest are unused. A variant plays once on mount,
  holds its last frame, and takes `still` (reduced motion: jump to the end) and `onend`. Variants: `Cosmos` (copy,
  timing and geometry in `cosmos.js`), `Race`, `ShipIt`, `Orrery`, `Keynote`, `Live`, `Channel`, `Fridge`. `stage.js`
  has the shared `play()` (one timeline, started after fonts load) and easing/typing helpers. Anything procedural
  derives from the timeline's current time so it stays seekable. Give each phase a hold after its last beat.
- `src/lib/content.js`: list-like copy as JS objects (testimonials, FAQ, API reference, pricing, …). One-off headings and
  paragraphs stay inline in the page. `src/lib/snippets.js`: code samples and the license text. Strings rendered with
  `rich()` (`src/lib/text.js`) support `` `code` ``, `*emphasis*` and `[links](#anchor)`.
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
pnpm build      # static output in dist/ (SITE_URL=https://… for canonical URLs and sitemap.xml)
pnpm preview    # serve dist/
```

## Deploy (Dokploy)
`Dockerfile` (build context: the repo root) installs only this package and `@badecision/core`, builds, and serves `dist/`
with nginx (`nginx.conf`: `/cloud` → `cloud.html`, `404.html` for unknown paths, immutable caching for `/_app/immutable/`).
The root `.dockerignore` keeps `.env`, `packages/model` and `node_modules` out of the context. If the site imports another
repo file outside `packages/core` and `packages/website`, add a `COPY` for it (as for `smol_kernel.wasm`).

Dokploy application settings: provider GitHub `Xerios/badecision`, branch `main`; Build Type **Dockerfile**, Docker File
`packages/website/Dockerfile`, Docker Context Path `.`; Build Args `SITE_URL=https://<domain>`; Domains: the domain,
container port **80**, HTTPS on; Auto Deploy on. Test locally with `pnpm run docker:website` (repo root) and
`docker run --rm -p 8080:80 badecision-website`.
