import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import logger from '../services/core/loggerService.js'

process.env.DB_NAME ??= 'dashboard_validation'
process.env.DB_USER ??= 'test'
const { default: app } = await import('../app.js')
const { ShelfEntry } = await import('../models/index.js')

test('an empty dashboard returns zero counts without fetching upstream metadata', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Dashboard must not call upstream') })
  t.mock.method(ShelfEntry, 'count', async () => [])
  t.mock.method(ShelfEntry, 'findAndCountAll', async () => ({ rows: [], count: 0 }))
  const result = await request(app).get('/api/dashboard?limit=2').expect(200)
  assert.equal(result.body.status, 200)
  assert.deepEqual(result.body.data.stats, { total: 0, wantToRead: 0, reading: 0, finished: 0 })
  for (const name of ['continueReading', 'nearlyFinished', 'recentlyFinished']) {
    assert.deepEqual(result.body.data[name], { data: [], meta: { count: 0, total: 0, limit: 2 } })
  }
})

test('invalid dashboard queries fail before querying MySQL', async t => {
  const lookup = t.mock.method(ShelfEntry, 'findAndCountAll', () => { throw new Error('Must not query') })
  for (const query of ['limit=0', 'limit=7', 'limit=1.5', 'limit=bad', 'status=reading', 'limit=2&limit=3']) {
    const result = await request(app).get(`/api/dashboard?${query}`).expect(400)
    assert.equal(result.body.status, 400)
    assert.equal(result.body.error.code, 'VALIDATION_ERROR')
  }
  assert.equal(lookup.mock.callCount(), 0)
})

test('dashboard database failures return a safe consistent error', async t => {
  t.mock.method(logger, 'error', () => {})
  t.mock.method(ShelfEntry, 'count', async () => [])
  t.mock.method(ShelfEntry, 'findAndCountAll', async () => { throw new Error('private SQL details') })
  const result = await request(app).get('/api/dashboard').expect(500)
  assert.equal(result.body.status, 500)
  assert.equal(result.body.error.code, 'INTERNAL_SERVER_ERROR')
  assert.doesNotMatch(result.text, /private SQL|stack/)
})
