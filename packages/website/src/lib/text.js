// Helpers for the content files: escaping, inline markup and a tiny code highlighter.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
export const esc = s => String(s).replace(/[&<>"]/g, c => ESC[c])

// Content strings support `code`, *emphasis* and [links](#anchor); everything else is escaped.
export const rich = s =>
  esc(s).replace(/`([^`]+)`|\*([^*\s][^*]*)\*|\[([^\]]+)\]\(([^)\s]+)\)/g, (_, code, em, label, href) =>
    code ? `<code>${code}</code>` : em ? `<em>${em}</em>` : `<a href="${href}">${label}</a>`,
  )

// Just enough JS/JSON highlighting for the snippets: comments, strings, keywords, calls, numbers.
const TOKENS =
  /(\/\/.*)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\b(import|from|export|const|let|if|else|await|async|return|new|true|false|null)\b|([A-Za-z_$][\w$]*)(?=\()|(\b\d[\d,.]*\b)/g
const KIND = [, 'c', 's', 'k', 'f', 'n']
export const highlight = code => paint(code, TOKENS, KIND)

// JSON (the playground's response): keys, string values, true/false/null, numbers, and a `//` line for errors.
const JSON_TOKENS = /(\/\/.*)|("(?:\\.|[^"\\\n])*")(?=\s*:)|("(?:\\.|[^"\\\n])*")|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g
const JSON_KIND = [, 'c', 'f', 's', 'k', 'n']
export const highlightJson = code => paint(code, JSON_TOKENS, JSON_KIND)

// Wraps each match in a span whose class is picked by the regex group that matched; the rest is escaped.
function paint(code, tokens, kinds) {
  let out = ''
  let last = 0
  for (const m of code.matchAll(tokens)) {
    const kind = kinds[m.findIndex((g, i) => i && g !== undefined)]
    out += esc(code.slice(last, m.index)) + `<span class="${kind}">${esc(m[0])}</span>`
    last = m.index + m[0].length
  }
  return out + esc(code.slice(last))
}
