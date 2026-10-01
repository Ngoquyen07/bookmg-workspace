import '../config/env.js'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { ForeignKeyConstraintError, UniqueConstraintError, DatabaseError } from 'sequelize'

const databaseName = `bookmg_schema_check_${randomUUID().replaceAll('-', '').slice(0, 12)}`
let administrator
let database
let created = false

function migrate(command, extra = []) {
  const result = spawnSync(process.execPath, [
    'node_modules/sequelize-cli/lib/sequelize', command,
    '--config', 'config/migrations.js', '--migrations-path', 'migrations',
    ...extra,
  ], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, DB_NAME: databaseName },
    encoding: 'utf8', timeout: 30_000,
  })
  assert.ifError(result.error)
  const output = result.stderr || result.stdout
  const safeOutput = process.env.DB_PASSWORD ? output.replaceAll(process.env.DB_PASSWORD, '[REDACTED]') : output
  assert.equal(result.status, 0, `${command} failed: ${safeOutput}`)
}

try {
  administrator = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1', port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD ?? '', connectTimeout: 5000,
  })
  await administrator.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  created = true
  process.env.DB_NAME = databaseName
  migrate('db:migrate', ['--to', '202609290002-create-shelf-entries.js'])
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await administrator.query(`INSERT INTO \`${databaseName}\`.books
    (id, title, authors, subjects, totalPages, editionId, createdAt, updatedAt)
    VALUES ('OL1W', 'Existing book', '[]', '[]', 100, 'OL1M', ?, ?)`, [now, now])
  await administrator.query(`INSERT INTO \`${databaseName}\`.shelf_entries
    (bookId, status, currentPage, createdAt, updatedAt)
    VALUES ('OL1W', 'reading', 12, ?, ?)`, [now, now])
  migrate('db:migrate')
  migrate('db:migrate') // Already applied migrations must be a no-op.

  const { sequelize } = await import('../config/database.js')
  database = sequelize
  const { Book, ShelfEntry } = await import('../models/index.js')
  const book = await Book.findByPk('OL1W')
  const entry = await ShelfEntry.findOne({ where: { bookId: book.id } })
  const stored = await ShelfEntry.findByPk(entry.id, { include: { model: Book, as: 'book' } })
  assert.equal(stored.book.title, book.title)
  assert.deepEqual(stored.book.authors, [])
  assert.equal(stored.status, 'reading')
  assert.equal(stored.currentPage, 12)
  assert.equal(stored.editionId, 'OL1M')
  assert.equal(stored.totalPages, 100)
  assert.equal(stored.rating, null)
  await assert.rejects(ShelfEntry.create({ bookId: book.id }), UniqueConstraintError)
  await assert.rejects(ShelfEntry.create({ bookId: 'OL999W' }), ForeignKeyConstraintError)
  await assert.rejects(Book.destroy({ where: { id: book.id } }), ForeignKeyConstraintError)
  // Bypass model validation to confirm that MySQL itself enforces CHECK constraints.
  const queries = database.getQueryInterface()
  await assert.rejects(queries.bulkUpdate('shelf_entries', { rating: 0 }, { id: entry.id }), DatabaseError)
  await assert.rejects(queries.bulkUpdate('shelf_entries', { totalPages: 0 }, { id: entry.id }), DatabaseError)
  const unknownPages = await Book.create({ id: 'OL2W', title: 'Unknown pages' })
  const unknownEntry = await ShelfEntry.create({ bookId: unknownPages.id })
  await unknownEntry.reload()
  assert.equal(unknownEntry.totalPages, null)
  assert.equal(unknownEntry.editionId, null)
  await unknownEntry.destroy()
  await unknownPages.destroy()

  const request = (await import('supertest')).default
  const app = (await import('../app.js')).default
  const originalFetch = globalThis.fetch
  globalThis.fetch = async url => {
    const path = new URL(url).pathname
    if (path === '/works/OL2W.json') return Response.json({
      key: '/works/OL2W', title: 'New book', authors: [{ author: { key: '/authors/OL1A' } }],
      covers: [123], subjects: ['Fiction'], first_publish_date: '2001',
    })
    if (path === '/works/OL3W.json') return Response.json({
      key: '/works/OL3W', title: 'Book without pages', authors: [],
    })
    if (path === '/authors/OL1A.json') return Response.json({ name: 'Test Author' })
    if (path === '/works/OL2W/editions.json') return Response.json({ entries: [
      { key: '/books/OL9M' },
      { key: '/books/OL2M', number_of_pages: 250 },
    ] })
    if (path === '/works/OL3W/editions.json') return Response.json({ entries: [] })
    if (path === '/books/OL2M.json') return Response.json({
      key: '/books/OL2M', works: [{ key: '/works/OL2W' }], number_of_pages: 250,
    })
    if (path === '/books/OL3M.json') return Response.json({
      key: '/books/OL3M', works: [{ key: '/works/OL999W' }], number_of_pages: 10,
    })
    return new Response(null, { status: 404 })
  }
  try {
    const api = request(app)
    let detail = await api.get('/api/books/OL2W')
    assert.equal(detail.status, 200)
    assert.equal(detail.body.status, detail.status)
    assert.equal(detail.body.data.isInShelf, false)
    assert.equal(detail.body.data.editionId, 'OL2M')
    assert.equal(detail.body.data.totalPages, 250)
    assert.equal(detail.body.data.coverUrl, '/api/books/covers/123')
    assert.deepEqual(detail.body.data.authors, ['Test Author'])
    assert.equal(await Book.count({ where: { id: 'OL2W' } }), 0)
    detail = await api.get('/api/books/OL3W')
    assert.equal(detail.status, 200)
    assert.equal(detail.body.data.editionId, null)
    assert.equal(detail.body.data.totalPages, null)
    assert.equal((await api.get('/api/books/OL404W')).status, 404)
    assert.equal((await api.get('/api/books/invalid')).status, 400)
    assert.equal((await api.get('/api/books/OL2W?extra=1')).status, 400)

    let response = await api.post('/api/shelf').send({ workId: 'OL2W', editionId: 'OL3M' })
    assert.equal(response.status, 400)
    assert.equal(await Book.count({ where: { id: 'OL2W' } }), 0)
    response = await api.post('/api/shelf').send({ workId: 'OL404W' })
    assert.equal(response.status, 404)

    response = await api.post('/api/shelf').send({ workId: 'OL2W', editionId: 'OL2M', status: 'finished' })
    assert.equal(response.status, 201, JSON.stringify(response.body))
    assert.equal(response.body.status, response.status)
    assert.equal(response.body.data.shelfEntry.currentPage, 250)
    assert.equal(response.body.data.shelfEntry.totalPages, 250)
    assert.deepEqual(response.body.data.book.authors, ['Test Author'])
    detail = await api.get('/api/books/OL2W')
    assert.equal(detail.body.data.isInShelf, true)
    assert.equal(detail.body.data.totalPages, 250)
    response = await api.get('/api/shelf')
    assert.equal(response.status, 200)
    assert.equal(response.body.status, response.status)
    assert.deepEqual(response.body.meta, { page: 1, limit: 10, count: 2, total: 2, totalPages: 1 })
    assert.deepEqual(response.body.data.map(item => item.shelfEntry.bookId), ['OL2W', 'OL1W'])
    assert.deepEqual(response.body.data.map(item => item.progressPercent), [100, 12])
    response = await api.get('/api/shelf?status=finished')
    assert.deepEqual(response.body.meta, { page: 1, limit: 10, count: 1, total: 1, totalPages: 1 })
    assert.deepEqual(response.body.data.map(item => item.shelfEntry.bookId), ['OL2W'])
    response = await api.get('/api/shelf?status=want_to_read')
    assert.deepEqual(response.body.meta, { page: 1, limit: 10, count: 0, total: 0, totalPages: 0 })
    assert.deepEqual(response.body.data, [])
    assert.equal((await api.get('/api/shelf?status=invalid')).status, 400)
    assert.equal((await api.get('/api/shelf?other=1')).status, 400)
    response = await api.get('/api/shelf/stats')
    assert.equal(response.body.status, response.status)
    assert.deepEqual(response.body.data, { total: 2, wantToRead: 0, reading: 1, finished: 1 })
    assert.equal((await api.get('/api/shelf/stats?status=reading')).status, 400)

    response = await api.patch('/api/shelf/OL1W').send({ status: 'reading', currentPage: 20, rating: 5, notes: 'Good book' })
    assert.equal(response.status, 200)
    assert.equal(response.body.data.currentPage, 20)
    assert.equal(response.body.data.rating, 5)
    assert.equal(response.body.data.notes, 'Good book')
    const startedAt = response.body.data.startedAt
    assert.ok(startedAt)
    for (const body of [
      {}, { currentPage: 101 }, { currentPage: -1 }, { currentPage: 1.5 },
      { rating: 0 }, { rating: 6 }, { notes: 'x'.repeat(1001) },
      { unknown: true }, { status: 'finished', currentPage: 30 },
    ]) {
      assert.equal((await api.patch('/api/shelf/OL1W').send(body)).status, 400)
    }
    assert.equal((await ShelfEntry.findOne({ where: { bookId: 'OL1W' } })).currentPage, 20)
    assert.equal((await api.patch('/api/shelf/bad').send({ rating: 3 })).status, 400)
    assert.equal((await api.patch('/api/shelf/OL1W?extra=1').send({ rating: 3 })).status, 400)
    assert.equal((await api.patch('/api/shelf/OL999W').send({ rating: 3 })).status, 404)

    response = await api.patch('/api/shelf/OL1W').send({ status: 'want_to_read', currentPage: 25 })
    assert.equal(response.body.data.status, 'reading')
    assert.equal(response.body.data.currentPage, 25)
    assert.equal(response.body.data.startedAt, startedAt)

    response = await api.patch('/api/shelf/OL1W').send({ currentPage: 100 })
    assert.equal(response.body.data.status, 'finished')
    assert.equal(response.body.data.currentPage, 100)
    assert.ok(response.body.data.finishedAt)
    response = await api.patch('/api/shelf/OL1W').send({ currentPage: 50 })
    assert.equal(response.body.data.status, 'reading')
    assert.equal(response.body.data.startedAt, startedAt)
    assert.equal(response.body.data.finishedAt, null)
    response = await api.patch('/api/shelf/OL1W').send({ status: 'finished' })
    assert.equal(response.body.data.currentPage, 100)
    assert.ok(response.body.data.finishedAt)
    response = await api.patch('/api/shelf/OL1W').send({ status: 'reading', currentPage: 40, rating: null, notes: null })
    assert.equal(response.body.data.status, 'reading')
    assert.equal(response.body.data.finishedAt, null)
    assert.equal(response.body.data.rating, null)
    assert.equal(response.body.data.notes, null)

    response = await api.post('/api/shelf').send({ workId: 'OL2W' })
    assert.equal(response.status, 409)
    response = await api.post('/api/shelf').send({ workId: 'OL2W', unexpected: true })
    assert.equal(response.status, 400)

    await ShelfEntry.destroy({ where: { bookId: 'OL2W' } })
    response = await api.post('/api/shelf').send({ workId: 'OL2W', status: 'reading' })
    assert.equal(response.status, 201)
    assert.equal(response.body.data.shelfEntry.totalPages, null)
    assert.ok(response.body.data.shelfEntry.startedAt)
    assert.equal(await Book.count({ where: { id: 'OL2W' } }), 1)
    response = await api.patch('/api/shelf/OL2W').send({ currentPage: 30 })
    assert.equal(response.status, 400)
    assert.equal((await ShelfEntry.findOne({ where: { bookId: 'OL2W' } })).status, 'reading')
    response = await api.patch('/api/shelf/OL2W').send({ status: 'finished' })
    assert.equal(response.body.data.currentPage, 0)
    assert.ok(response.body.data.finishedAt)
    response = await api.patch('/api/shelf/OL2W').send({ status: 'reading' })
    assert.equal(response.body.data.finishedAt, null)
    response = await api.get('/api/shelf?status=reading')
    assert.deepEqual(response.body.meta, { page: 1, limit: 10, count: 2, total: 2, totalPages: 1 })
    assert.deepEqual(response.body.data.map(item => item.progressPercent), [null, 40])

    await ShelfEntry.destroy({ where: { bookId: 'OL2W' } })
    response = await api.post('/api/shelf').send({ workId: 'OL2W' })
    assert.equal(response.status, 201)
    assert.equal(response.body.data.shelfEntry.status, 'want_to_read')
    assert.equal(response.body.data.shelfEntry.currentPage, 0)
    assert.equal(response.body.data.shelfEntry.startedAt, null)

    Book.addHook('beforeBulkDestroy', 'failDelete', () => { throw new Error('Forced book delete failure') })
    response = await api.delete('/api/shelf/OL2W')
    Book.removeHook('beforeBulkDestroy', 'failDelete')
    assert.equal(response.status, 500)
    assert.equal(await ShelfEntry.count({ where: { bookId: 'OL2W' } }), 1)
    assert.equal(await Book.count({ where: { id: 'OL2W' } }), 1)

    response = await api.delete('/api/shelf/OL2W')
    assert.equal(response.status, 200)
    assert.deepEqual(response.body.data, { bookId: 'OL2W', removed: true })
    assert.equal(await ShelfEntry.count({ where: { bookId: 'OL2W' } }), 0)
    assert.equal(await Book.count({ where: { id: 'OL2W' } }), 0)
    assert.equal((await api.get('/api/books/OL2W')).body.data.isInShelf, false)
    assert.equal((await api.delete('/api/shelf/OL2W')).status, 404)
    assert.equal((await api.delete('/api/shelf/bad')).status, 400)
    assert.equal((await api.delete('/api/shelf/OL1W?extra=1')).status, 400)
    response = await api.post('/api/shelf').send({ workId: 'OL2W' })
    assert.equal(response.status, 201)
    assert.equal(await Book.count({ where: { id: 'OL2W' } }), 1)
    assert.equal(await ShelfEntry.count({ where: { bookId: 'OL2W' } }), 1)
    assert.equal((await api.post('/api/shelf').send({ workId: 'OL2W' })).status, 409)
    assert.equal((await api.delete('/api/shelf/OL2W')).status, 200)
    assert.equal(await Book.count({ where: { id: 'OL2W' } }), 0)
    ShelfEntry.addHook('beforeCreate', 'failOnce', () => { throw new Error('Forced shelf write failure') })
    response = await api.post('/api/shelf').send({ workId: 'OL2W' })
    ShelfEntry.removeHook('beforeCreate', 'failOnce')
    assert.equal(response.status, 500)
    assert.equal(await Book.count({ where: { id: 'OL2W' } }), 0)
  } finally {
    globalThis.fetch = originalFetch
  }
  await entry.destroy()
  assert.ok(await Book.findByPk(book.id))
  const emptyStats = await request(app).get('/api/shelf/stats')
  assert.deepEqual(emptyStats.body.data, { total: 0, wantToRead: 0, reading: 0, finished: 0 })
  await database.close()
  database = undefined

  migrate('db:migrate:undo:all')
  const [tables] = await administrator.query(`SHOW TABLES FROM \`${databaseName}\``)
  assert.deepEqual(tables.map(row => Object.values(row)[0].toLowerCase()), ['sequelizemeta'])
  console.log('MySQL checks OK: migration/backfill, shelf add/detail/list/update/delete/stats and rollback')
} catch (error) {
  console.error('MySQL schema checks failed:', error.original?.code ?? error.code ?? error.name)
  if (error.name === 'AssertionError') console.error(error.message)
  process.exitCode = 1
} finally {
  await database?.close()
  // Only delete the randomly named database created by this invocation.
  if (created && /^bookmg_schema_check_[a-f0-9]{12}$/.test(databaseName)) {
    await administrator.query(`DROP DATABASE \`${databaseName}\``)
  }
  await administrator?.end()
}
