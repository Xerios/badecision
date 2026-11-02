// Per-page title and description. The pages are prerendered with SSR off, so <svelte:head> never reaches the static
// HTML: src/hooks.server.js writes these tags into each page at build time, and the layout keeps them in step on
// client-side navigation.

export const siteName = 'BAdecision'

export const pages = {
  '/': {
    title: 'BAdecision: Balanced Assessment Decisions',
    description: 'Decisions as a service, without the service. Yes, no, maybe or not sure, on-device, with a little help from the stars.',
  },
  '/developers': {
    title: 'Developers · BAdecision',
    description: 'The BAdecision playground, API reference, model card, test suite and license.',
  },
  '/cloud': {
    title: 'Cloud · BAdecision',
    description: 'BAdecision Cloud: decisions as a service, now with the service. Adjustable astrological influence, an SLA and artificial latency.',
  },
}

export const meta = pathname => pages[pathname] ?? pages['/']

const escape = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// The <head> tags for a page. `site` is the absolute origin (SITE_URL at build time); without it, the tags that need an
// absolute URL (canonical, og:url) are left out.
export function headTags(pathname, site) {
  const { title, description } = meta(pathname)
  const url = site && site + (pathname === '/' ? '/' : pathname)
  const tags = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}">`,
    url && `<link rel="canonical" href="${escape(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${siteName}">`,
    `<meta property="og:title" content="${escape(title)}">`,
    `<meta property="og:description" content="${escape(description)}">`,
    url && `<meta property="og:url" content="${escape(url)}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${escape(title)}">`,
    `<meta name="twitter:description" content="${escape(description)}">`,
  ]
  if (pathname === '/') tags.push(`<script type="application/ld+json">${JSON.stringify(structuredData(site)).replace(/</g, '\\u003c')}</script>`)
  return tags.filter(Boolean).join('\n')
}

// schema.org data for the landing page: the npm package as a free developer tool
const structuredData = site => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteName,
  alternateName: 'Balanced Assessment Decisions',
  description: pages['/'].description,
  ...(site && { url: site + '/' }),
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Node.js, Deno, Bun, web browsers',
  softwareVersion: '2.0.3',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  downloadUrl: 'https://www.npmjs.com/package/badecision',
  license: 'https://opensource.org/licenses/MIT',
})
