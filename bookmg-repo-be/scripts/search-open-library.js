import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { OPEN_LIBRARY_URLS } from '../constants/openLibraryConstants.js'

const output = new URL('../.tmp/open-library/', import.meta.url)
const keyword = process.argv.slice(2).join(' ').trim() || 'Harry Potter'
const url = new URL(OPEN_LIBRARY_URLS.SEARCH)
url.search = new URLSearchParams({ q: keyword, page: '1', limit: '5' }).toString()

async function request(endpoint) {
  console.log(`GET ${endpoint}`)
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(30_000) })
  console.log(`HTTP ${response.status} ${response.statusText}`)
  if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`)
  return response
}

async function saveJson(name, data) {
  await writeFile(new URL(name, output), JSON.stringify(data, null, 2) + '\n')
}

// Observed sample shapes, not an exhaustive schema for all Open Library records.
function shape(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return { type: 'array', firstItem: value.length ? shape(value[0]) : 'unknown' }
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]))
  return typeof value
}

try {
  await mkdir(output, { recursive: true })
  const search = await (await request(url)).json()
  await saveJson('search.json', search)
  const book = search.docs?.[0]
  if (!book) throw new Error('No search results; search.json contains the response')
  await saveJson('selected-book.json', book)

  const workId = book.key?.split('/').at(-1)
  if (!/^OL\d+W$/.test(workId ?? '')) throw new Error('First result has no valid Open Library work ID')

  const report = {
    keyword,
    workId,
    title: book.title,
    totalResults: search.numFound ?? search.num_found,
    searchUrl: url.href,
    note: 'Sample shapes only. Fields can be absent or have different types in other records.',
    searchSampleShape: shape(search),
  }

  const results = await Promise.allSettled([
    (async () => {
      const endpoint = `${OPEN_LIBRARY_URLS.WORKS}${workId}.json`
      const detail = await (await request(endpoint)).json()
      await saveJson('detail.json', detail)
      return { url: endpoint, file: 'detail.json', sampleShape: shape(detail) }
    })(),
    (async () => {
      if (!Number.isInteger(book.cover_i) || book.cover_i <= 0) {
        return { skipped: 'Selected book has no valid cover_i' }
      }
      const endpoint = `${OPEN_LIBRARY_URLS.COVERS}${book.cover_i}-M.jpg?default=false`
      const response = await request(endpoint)
      const contentType = response.headers.get('content-type')?.split(';')[0]
      if (contentType !== 'image/jpeg') throw new Error(`Expected JPEG cover, received ${contentType}`)
      const bytes = new Uint8Array(await response.arrayBuffer())
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Response is not a JPEG image')
      await writeFile(new URL('cover.jpg', output), bytes)
      return { url: endpoint, file: 'cover.jpg', contentType, bytes: bytes.length }
    })(),
  ])

  for (const [index, name] of ['detail', 'cover'].entries()) {
    const result = results[index]
    report[name] = result.status === 'fulfilled' ? result.value : { error: result.reason.message }
    if (result.status === 'rejected') process.exitCode = 1
  }
  await saveJson('report.json', report)
  console.log(JSON.stringify(report, null, 2))
  console.log(`Saved responses to ${fileURLToPath(output)}`)
} catch (error) {
  console.error(`API inspection failed: ${error.message}`)
  if (error.cause?.code) console.error(`Cause: ${error.cause.code}`)
  process.exitCode = 1
}
