import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { Op } from 'sequelize'
import logger from '../services/core/loggerService.js'

process.env.DB_NAME ??= 'search_validation'
process.env.DB_USER ??= 'test'
const { default: app } = await import('../app.js')
const { ShelfEntry } = await import('../models/index.js')

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
}

test('search normalizes metadata and checks shelf membership in one read', async t => {
  const log = t.mock.method(logger, 'info', () => {})
  const upstream = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.origin, 'https://openlibrary.org')
    assert.equal(url.searchParams.get('q'), 'Harry & Potter')
    assert.equal(url.searchParams.get('page'), '2')
    assert.equal(url.searchParams.get('limit'), '2')
    assert.ok(options.signal instanceof AbortSignal)
    return json({ numFound: 5, docs: [
      { key: '/works/OL1W', title: 'Harry Potter', author_name: ['Author'], cover_i: 123, first_publish_year: 1997 },
      { key: 'OL2W', title: 'Missing metadata', author_name: [42], cover_i: -1 },
    ] })
  })
  const lookup = t.mock.method(ShelfEntry, 'findAll', async options => {
    assert.deepEqual(options.attributes, ['bookId'])
    assert.deepEqual(options.where.bookId[Op.in], ['OL1W', 'OL2W'])
    return [{ bookId: 'OL1W' }]
  })
  // A read-only search must never persist the upstream results.
  t.mock.method(ShelfEntry, 'create', () => { throw new Error('Search must not write') })
  const result = await request(app).get('/api/books/search').query({ q: ' Harry & Potter ', page: 2, limit: 2 }).expect(200)
  assert.deepEqual(result.body, {
    status: 200,
    data: [
      { id: 'OL1W', title: 'Harry Potter', authors: ['Author'], coverId: 123, coverUrl: '/api/books/covers/123', firstPublishYear: 1997, isInShelf: true },
      { id: 'OL2W', title: 'Missing metadata', authors: [], coverId: null, coverUrl: null, firstPublishYear: null, isInShelf: false },
    ],
    meta: { page: 2, limit: 2, count: 2, total: 5, totalPages: 3 },
  })
  assert.equal(upstream.mock.callCount(), 1)
  assert.equal(lookup.mock.callCount(), 1)
  assert.equal(log.mock.calls[0].arguments[1].path, '/api/books/search')
})

test('title/author search forwards the right field and empty results skip MySQL', async t => {
  t.mock.method(ShelfEntry, 'findAll', () => { throw new Error('Empty search must skip MySQL') })
  for (const field of ['title', 'author']) {
    t.mock.method(globalThis, 'fetch', async url => {
      assert.equal(url.searchParams.get(field), 'Tolkien')
      assert.equal(url.searchParams.has('q'), false)
      assert.equal(url.searchParams.get('page'), '1')
      assert.equal(url.searchParams.get('limit'), '20')
      return json({ num_found: 0, docs: [] })
    })
    await request(app).get('/api/books/search').query({ q: 'Tolkien', field }).expect(200, {
      status: 200,
      data: [], meta: { page: 1, limit: 20, count: 0, total: 0, totalPages: 0 },
    })
    t.mock.restoreAll()
    t.mock.method(ShelfEntry, 'findAll', () => { throw new Error('Empty search must skip MySQL') })
  }
})

test('invalid query and cover IDs are rejected before upstream calls', async t => {
  const upstream = t.mock.method(globalThis, 'fetch', () => { throw new Error('Invalid input must not reach upstream') })
  for (const query of [
    {}, { q: ' ' }, { q: 'x'.repeat(201) }, { q: ['a', 'b'] },
    { q: 'x', field: 'unknown' }, { q: 'x', page: 0 }, { q: 'x', page: 1.5 },
    { q: 'x', limit: 51 }, { q: 'x', unexpected: 'field' },
  ]) {
    const result = await request(app).get('/api/books/search').query(query).expect(400)
    assert.equal(result.body.status, result.status)
    assert.equal(result.body.error.code, 'VALIDATION_ERROR')
  }
  for (const id of ['0', '-1', 'abc', '4294967296']) {
    const result = await request(app).get(`/api/books/covers/${id}`).expect(400)
    assert.equal(result.body.status, result.status)
    assert.equal(result.body.error.code, 'VALIDATION_ERROR')
  }
  assert.equal(upstream.mock.callCount(), 0)
})

test('upstream failures and invalid payloads produce safe 502/504 errors', async t => {
  for (const [fetchResponse, status, code] of [
    [() => json({ private: 'upstream details' }, 429), 502, 'OPEN_LIBRARY_ERROR'],
    [() => new Response('not JSON'), 502, 'OPEN_LIBRARY_ERROR'],
    [() => json(null), 502, 'OPEN_LIBRARY_ERROR'],
    [() => json({ numFound: 1, docs: [{ key: 'invalid', title: 'Invalid' }] }), 502, 'OPEN_LIBRARY_ERROR'],
    [() => { throw new TypeError('private network details') }, 502, 'OPEN_LIBRARY_ERROR'],
    [() => { throw new DOMException('private timeout details', 'TimeoutError') }, 504, 'OPEN_LIBRARY_TIMEOUT'],
  ]) {
    t.mock.method(globalThis, 'fetch', fetchResponse)
    const result = await request(app).get('/api/books/search?q=Harry').expect(status)
    assert.equal(result.body.status, result.status)
    assert.equal(result.body.error.code, code)
    assert.doesNotMatch(result.text, /private|stack/)
    t.mock.restoreAll()
  }
})

test('database failure is an error, not a false already-added badge', async t => {
  const log = t.mock.method(logger, 'error', () => {})
  t.mock.method(globalThis, 'fetch', async () => json({ numFound: 1, docs: [{ key: 'OL1W', title: 'Book' }] }))
  t.mock.method(ShelfEntry, 'findAll', async () => {
    const error = new Error('private SQL details')
    error.original = { code: 'ECONNREFUSED' }
    throw error
  })
  const result = await request(app).get('/api/books/search?q=Book').expect(500)
  assert.equal(result.body.status, result.status)
  assert.equal(result.body.error.code, 'INTERNAL_SERVER_ERROR')
  assert.doesNotMatch(result.text, /private SQL/)
  const failure = log.mock.calls.find(call => call.arguments[1].code === 'INTERNAL_SERVER_ERROR')
  assert.ok(failure)
  assert.equal(failure.arguments[1].causeCode, 'ECONNREFUSED')
  assert.equal(failure.arguments[0], 'shelfRepository.findShelfBookIds')
  assert.equal(log.mock.calls.filter(call => call.arguments[1].code === 'INTERNAL_SERVER_ERROR').length, 1)
  const completed = log.mock.calls.find(call => call.arguments[1].status === 500)
  assert.equal(completed.arguments[1].path, '/api/books/search')
  assert.doesNotMatch(JSON.stringify(failure.arguments), /private SQL/)
})

test('timeout while consuming the upstream body also returns 504', async t => {
  t.mock.method(AbortSignal, 'timeout', () => AbortSignal.abort(new DOMException('Timed out', 'TimeoutError')))
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true, status: 200,
    json: async () => { throw new DOMException('Body aborted', 'AbortError') },
  }))
  const result = await request(app).get('/api/books/search?q=Book').expect(504)
  assert.equal(result.body.status, result.status)
  assert.equal(result.body.error.code, 'OPEN_LIBRARY_TIMEOUT')
})

test('cover proxy returns JPEG bytes and handles missing or invalid images', async t => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9])
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://covers.openlibrary.org/b/id/123-M.jpg?default=false')
    return new Response(jpeg, { headers: { 'Content-Type': 'image/jpeg' } })
  })
  const result = await request(app).get('/api/books/covers/123').expect(200).expect('Content-Type', /image\/jpeg/)
  assert.deepEqual(result.body, jpeg)
  assert.equal(result.headers['cache-control'], 'public, max-age=86400')
  t.mock.restoreAll()
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 404 }))
  const missing = await request(app).get('/api/books/covers/123').expect(404)
  assert.equal(missing.body.status, missing.status)
  assert.equal(missing.body.error.code, 'COVER_NOT_FOUND')
  t.mock.restoreAll()
  t.mock.method(globalThis, 'fetch', async () => new Response('HTML', { headers: { 'Content-Type': 'image/jpeg' } }))
  const invalid = await request(app).get('/api/books/covers/123').expect(502)
  assert.equal(invalid.body.status, invalid.status)
  assert.equal(invalid.body.error.code, 'OPEN_LIBRARY_ERROR')
})
