import assert from 'node:assert/strict'
import test from 'node:test'

// Model validation does not connect to MySQL. CI needs no database credentials.
process.env.DB_NAME ??= 'model_validation'
process.env.DB_USER ??= 'test'
const { Book, ShelfEntry } = await import('../models/index.js')

test('book metadata supports missing fields and rejects invalid data', async () => {
  const book = Book.build({ id: 'OL82563W', title: 'Harry Potter' })
  await book.validate()
  assert.deepEqual(book.authors, [])
  assert.deepEqual(book.subjects, [])
  assert.equal(book.totalPages, undefined)
  for (const data of [
    { id: '/works/OL82563W' }, { title: '   ' }, { authors: [42] },
    { subjects: 'Fantasy' }, { totalPages: 0 }, { totalPages: 2.5 }, { editionId: 'OL82563W' },
  ]) {
    await assert.rejects(Book.build({ id: 'OL82563W', title: 'Harry Potter', ...data }).validate())
  }
})

test('shelf entry defaults and validation preserve reading data boundaries', async () => {
  const entry = ShelfEntry.build({ bookId: 'OL82563W' })
  await entry.validate()
  assert.equal(entry.status, 'want_to_read')
  assert.equal(entry.currentPage, 0)
  for (const data of [
    { status: 'unknown' }, { currentPage: -1 }, { currentPage: 1.5 },
    { rating: 0 }, { rating: 6 }, { rating: 2.5 }, { notes: 'x'.repeat(1001) },
  ]) {
    await assert.rejects(ShelfEntry.build({ bookId: 'OL82563W', ...data }).validate())
  }
  assert.equal(Book.associations.shelfEntry.target, ShelfEntry)
  assert.equal(ShelfEntry.associations.book.target, Book)
})
