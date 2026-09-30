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
  const now = new Date()
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
    if (path === '/authors/OL1A.json') return Response.json({ name: 'Test Author' })
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
    let response = await api.post('/api/shelf').send({ workId: 'OL2W', editionId: 'OL3M' })
    assert.equal(response.status, 400)
    assert.equal(await Book.count({ where: { id: 'OL2W' } }), 0)
    response = await api.post('/api/shelf').send({ workId: 'OL404W' })
    assert.equal(response.status, 404)

    response = await api.post('/api/shelf').send({ workId: 'OL2W', editionId: 'OL2M', status: 'finished' })
    assert.equal(response.status, 201, JSON.stringify(response.body))
    assert.equal(response.body.data.shelfEntry.currentPage, 250)
    assert.equal(response.body.data.shelfEntry.totalPages, 250)
    assert.deepEqual(response.body.data.book.authors, ['Test Author'])
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

    await ShelfEntry.destroy({ where: { bookId: 'OL2W' } })
    response = await api.post('/api/shelf').send({ workId: 'OL2W' })
    assert.equal(response.status, 201)
    assert.equal(response.body.data.shelfEntry.status, 'want_to_read')
    assert.equal(response.body.data.shelfEntry.currentPage, 0)
    assert.equal(response.body.data.shelfEntry.startedAt, null)

    await ShelfEntry.destroy({ where: { bookId: 'OL2W' } })
    await Book.destroy({ where: { id: 'OL2W' } })
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
  await database.close()
  database = undefined

  migrate('db:migrate:undo:all')
  const [tables] = await administrator.query(`SHOW TABLES FROM \`${databaseName}\``)
  assert.deepEqual(tables.map(row => Object.values(row)[0].toLowerCase()), ['sequelizemeta'])
  console.log('MySQL checks OK: migration/backfill, constraints, shelf API and transaction rollback')
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
