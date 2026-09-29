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

function migrate(command) {
  const result = spawnSync(process.execPath, [
    'node_modules/sequelize-cli/lib/sequelize', command,
    '--config', 'config/migrations.js', '--migrations-path', 'migrations',
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
  migrate('db:migrate')
  migrate('db:migrate') // Already applied migrations must be a no-op.

  const { sequelize } = await import('../config/database.js')
  database = sequelize
  const { Book, ShelfEntry } = await import('../models/index.js')
  const book = await Book.create({ id: 'OL1W', title: 'Sách thử 📚', authors: ['Tác giả'], totalPages: 100 })
  const entry = await ShelfEntry.create({ bookId: book.id })
  const stored = await ShelfEntry.findByPk(entry.id, { include: { model: Book, as: 'book' } })
  assert.equal(stored.book.title, book.title)
  assert.deepEqual(stored.book.authors, ['Tác giả'])
  assert.equal(stored.status, 'want_to_read')
  assert.equal(stored.currentPage, 0)
  assert.equal(stored.rating, null)
  await assert.rejects(ShelfEntry.create({ bookId: book.id }), UniqueConstraintError)
  await assert.rejects(ShelfEntry.create({ bookId: 'OL999W' }), ForeignKeyConstraintError)
  await assert.rejects(Book.destroy({ where: { id: book.id } }), ForeignKeyConstraintError)
  // Bypass model validation to confirm that MySQL itself enforces CHECK constraints.
  const queries = database.getQueryInterface()
  await assert.rejects(queries.bulkUpdate('shelf_entries', { rating: 0 }, { id: entry.id }), DatabaseError)
  await assert.rejects(queries.bulkUpdate('books', { totalPages: 0 }, { id: book.id }), DatabaseError)
  const unknownPages = await Book.create({ id: 'OL2W', title: 'Unknown pages' })
  await unknownPages.reload()
  assert.equal(unknownPages.totalPages, null)
  await entry.destroy()
  assert.ok(await Book.findByPk(book.id))
  await database.close()
  database = undefined

  migrate('db:migrate:undo:all')
  const [tables] = await administrator.query(`SHOW TABLES FROM \`${databaseName}\``)
  assert.deepEqual(tables.map(row => Object.values(row)[0].toLowerCase()), ['sequelizemeta'])
  console.log('MySQL schema checks OK: migrations, JSON, relations, unique/FK/CHECK constraints and rollback')
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
