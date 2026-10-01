import assert from 'node:assert/strict'
import test from 'node:test'
import { validateSearch } from '../src/modules/books/validation/searchValidation.js'
import { validateShelfUpdate } from '../src/modules/shelf/validation/shelfValidation.js'

test('search needs a nonblank keyword within the backend limit', () => {
  assert.ok(validateSearch('   '))
  assert.ok(validateSearch('a'.repeat(201)))
  assert.equal(validateSearch('  Dune  '), '')
})

test('reading edits reject invalid pages, ratings and notes', () => {
  const valid = { currentPage: 100, totalPages: 100, rating: null, notes: '' }
  assert.deepEqual(validateShelfUpdate(valid), { currentPage: '', rating: '', notes: '' })
  for (const currentPage of ['', null, -1, 1.5, 101]) {
    assert.ok(validateShelfUpdate({ ...valid, currentPage }).currentPage)
  }
  for (const rating of [-1, 0, 1.5, 6]) {
    assert.ok(validateShelfUpdate({ ...valid, rating }).rating)
  }
  assert.ok(validateShelfUpdate({ ...valid, notes: 'x'.repeat(1001) }).notes)
  assert.deepEqual(validateShelfUpdate({ ...valid, totalPages: null, currentPage: undefined }), { currentPage: '', rating: '', notes: '' })
})
