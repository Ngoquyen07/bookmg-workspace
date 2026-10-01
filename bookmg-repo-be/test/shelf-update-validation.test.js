import assert from 'node:assert/strict'
import test from 'node:test'
import { validateAddBook, validateShelfFilter, validateShelfUpdate } from '../validation/shelfValidation.js'
import { API_ERRORS } from '../constants/responseConstants.js'

test('shelf update rejects invalid page and rating values at the API boundary', () => {
  for (const currentPage of [null, -1, 1.5, '2']) {
    assert.throws(() => validateShelfUpdate({ currentPage }), error => error.descriptor === API_ERRORS.VALIDATION_ERROR)
  }
  for (const rating of [-1, 0, 1.5, 6, '5']) {
    assert.throws(() => validateShelfUpdate({ rating }), error => error.descriptor === API_ERRORS.VALIDATION_ERROR)
  }
  assert.deepEqual(validateShelfUpdate({ currentPage: 3, rating: 5 }), { currentPage: 3, rating: 5 })
  assert.deepEqual(validateShelfUpdate({ rating: null }), { rating: null })
})

test('shelf list accepts bounded pagination and status filters', () => {
  assert.deepEqual(validateShelfFilter({}), { page: 1, limit: 10 })
  assert.deepEqual(validateShelfFilter({ status: 'reading', page: '2', limit: '5' }), { status: 'reading', page: 2, limit: 5 })
  for (const query of [{ page: '0' }, { page: '1.5' }, { page: '10001' }, { limit: '0' }, { limit: '51' }, { status: 'other' }]) {
    assert.throws(() => validateShelfFilter(query), error => error.descriptor === API_ERRORS.VALIDATION_ERROR)
  }
})

test('adding a work does not accept an initial status', () => {
  assert.deepEqual(validateAddBook({ workId: 'OL19721157W' }), { workId: 'OL19721157W' })
  for (const status of ['want_to_read', 'reading', 'finished']) {
    assert.throws(() => validateAddBook({ workId: 'OL19721157W', status }), error => error.descriptor === API_ERRORS.VALIDATION_ERROR)
  }
})
