import { writeFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'

// SITE_URL (e.g. https://example.com) gives the absolute URLs for canonical/og:url (src/hooks.server.js) and the sitemap.
const site = process.env.SITE_URL?.replace(/\/+$/, '')

// adapter-static, then robots.txt and (with SITE_URL) sitemap.xml from the prerendered pages
const staticAdapter = adapter({ pages: 'dist', assets: 'dist', fallback: undefined, strict: true })
const seoAdapter = {
  ...staticAdapter,
  async adapt(builder) {
    await staticAdapter.adapt(builder)
    writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n${site ? `\nSitemap: ${site}/sitemap.xml\n` : ''}`)
    if (!site) return builder.log.warn('SITE_URL is not set: no sitemap.xml, canonical or og:url')
    const urls = builder.prerendered.paths.map(path => `  <url><loc>${site}${path === '/' ? '/' : path}</loc></url>`)
    writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
  },
}

// SvelteKit 3 takes its config here; svelte.config.js is no longer supported.
export default defineConfig({
  plugins: [sveltekit({ adapter: seoAdapter })],
  server: { port: 5173 },
})
