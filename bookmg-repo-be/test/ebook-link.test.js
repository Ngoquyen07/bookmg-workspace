import assert from 'node:assert/strict'
import test from 'node:test'
import { getReadingUrl, getSuggestedEdition } from '../adapters/openLibraryAdapter.js'
import { normalizeReadingUrl } from '../utils/readingUrl.js'
import logger from '../services/core/loggerService.js'

const item = overrides => ({
  match: 'exact', status: 'full access', 'ol-edition-id': 'OL1M', 'ol-work-id': 'OL1W',
  itemURL: 'http://archive.org/stream/example', ...overrides,
})

test('ebook links require exact edition/work matches and trusted URLs', async t => {
  const upstream = t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://openlibrary.org/api/volumes/brief/olid/OL1M.json')
    return Response.json({ items: [
      item({ match: 'similar' }), item({ 'ol-work-id': 'OL2W' }), item({ 'ol-edition-id': 'OL2M' }),
      item({ status: 'restricted' }), item({ status: 'checked out' }),
      item({ itemURL: 'https://archive.org.evil.example/ebook' }), item({ status: 'lendable' }),
    ] })
  })
  assert.equal(await getReadingUrl('OL1M', 'OL1W'), 'https://archive.org/stream/example')
  assert.equal(await getReadingUrl(null, 'OL1W'), null)
  assert.equal(upstream.mock.callCount(), 1)
  for (const url of ['javascript:alert(1)', 'https://user:secret@archive.org/a', 'https://archive.org:123/a',
    'https://evil.example/a', '', null, `https://archive.org/${'x'.repeat(2048)}`]) {
    assert.equal(normalizeReadingUrl(url), null)
  }
})

test('missing or failed ebook lookups remain optional', async t => {
  t.mock.method(logger, 'logError', () => {})
  for (const response of [
    () => Response.json({ items: [] }), () => Response.json({ items: [item({ match: 'similar' })] }),
    () => Response.json(null), () => new Response('invalid'), () => new Response(null, { status: 503 }),
    () => { throw new DOMException('Timeout', 'TimeoutError') },
  ]) {
    const fetch = t.mock.method(globalThis, 'fetch', response)
    assert.equal(await getReadingUrl('OL1M', 'OL1W'), null)
    fetch.mock.restore()
  }
})

test('a suggested edition without page counts can still be used for ebook lookup', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ entries: [{ key: '/books/OL1M' }] }))
  assert.deepEqual(await getSuggestedEdition('OL1W'), { editionId: 'OL1M', totalPages: null })
})
