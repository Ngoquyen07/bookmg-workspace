export function normalizeReadingUrl(value) {
  try {
    if (typeof value !== 'string' || value.length > 2048) return null
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port ||
        !['openlibrary.org', 'www.openlibrary.org', 'archive.org', 'www.archive.org'].includes(url.hostname)) return null
    url.protocol = 'https:'
    return url.href.length <= 2048 ? url.href : null
  } catch {
    return null
  }
}
