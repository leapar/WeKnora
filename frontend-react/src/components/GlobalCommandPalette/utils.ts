/**
 * Safely highlight query keywords inside a plain-text string by wrapping
 * matches in <mark> tags. The input text is HTML-escaped first so the output
 * is safe to use with dangerouslySetInnerHTML.
 */
export function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function highlightText(text: string, query: string): string {
  const q = (query || '').trim()
  const escaped = escapeHtml(text || '')
  if (!q) return escaped
  const keywords = q.split(/\s+/).filter(Boolean)
  let result = escaped
  for (const kw of keywords) {
    const escapedKw = escapeHtml(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (!escapedKw) continue
    const regex = new RegExp(`(${escapedKw})`, 'gi')
    result = result.replace(regex, '<mark class="search-highlight">$1</mark>')
  }
  return result
}