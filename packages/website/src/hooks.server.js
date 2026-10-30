// Runs only while prerendering (and in dev): fills app.html's %seo.head% with the page's title, description and social
// tags from #lib/seo.js. SITE_URL (e.g. https://example.com) is read at build time for the absolute URLs.
import { headTags } from '#lib/seo.js'

const site = process.env.SITE_URL?.replace(/\/+$/, '')

export const handle = ({ event, resolve }) =>
  resolve(event, { transformPageChunk: ({ html }) => html.replace('%seo.head%', headTags(event.url.pathname, site)) })
