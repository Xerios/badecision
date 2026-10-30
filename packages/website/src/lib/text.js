// Helpers for the content files: escaping, inline markup and a tiny code highlighter.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
export const esc = s => String(s).replace(/[&<>"]/g, c => ESC[c])

// Content strings support `code` and *emphasis*; everything else is escaped.
export const rich = s => esc(s).replace(/`([^`]+)`|\*([^*\s][^*]*)\*/g, (_, code, em) => (code ? `<code>${code}</code>` : `<em>${em}</em>`))

// Just enough JS/JSON highlighting for the snippets: comments, strings, keywords, calls, numbers.
const TOKENS =
  /(\/\/.*)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\b(import|from|export|const|let|if|else|await|async|return|new|true|false|null)\b|([A-Za-z_$][\w$]*)(?=\()|(\b\d[\d,.]*\b)/g
const KIND = [, 'c', 's', 'k', 'f', 'n']

export function highlight(code) {
  let out = ''
  let last = 0
  for (const m of code.matchAll(TOKENS)) {
    const kind = KIND[m.findIndex((g, i) => i && g !== undefined)]
    out += esc(code.slice(last, m.index)) + `<span class="${kind}">${esc(m[0])}</span>`
    last = m.index + m[0].length
  }
  return out + esc(code.slice(last))
}
