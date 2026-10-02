import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import logger from '../services/core/loggerService.js'
import ApiError from '../utils/apiError.js'
import { API_ERRORS } from '../constants/responseConstants.js'
import { EventEmitter } from 'node:events'
import requestLogger from '../middleware/requestLogger.js'

test('successful health checks skip logging while failures and business requests remain logged', t => {
  const info = t.mock.method(logger, 'info', () => {})
  const error = t.mock.method(logger, 'error', () => {})
  const warn = t.mock.method(logger, 'warn', () => {})
  for (const [path, statusCode] of [['/api/health', 200], ['/api/health', 500], ['/api/health', 400], ['/api/shelf', 200]]) {
    const res = Object.assign(new EventEmitter(), { statusCode })
    let forwarded = false
    requestLogger({ method: 'GET', path }, res, () => { forwarded = true })
    assert.equal(forwarded, true)
    res.emit('finish')
  }
  assert.equal(info.mock.callCount(), 1)
  assert.equal(info.mock.calls[0].arguments[1].path, '/api/shelf')
  assert.equal(error.mock.callCount(), 1)
  assert.equal(warn.mock.callCount(), 1)
})

test('logger persists structured entries and redacts sensitive context', async () => {
  const message = `Logger check ${randomUUID()}`
  const date = new Date().toISOString().slice(0, 10)
  await logger.info(message, {
    password: 'do-not-log',
    nested: { authorization: 'do-not-log', count: 2 },
    error: new Error('Sample error'),
  })
  await logger.flush()
  const content = await readFile(new URL(`../logs/${date}.log`, import.meta.url), 'utf8')
  const entry = content.trim().split('\n').map(line => JSON.parse(line))
    .find(item => item.message === message)
  assert.ok(entry)
  assert.equal(entry.level, 'info')
  assert.equal(entry.context.password, '[REDACTED]')
  assert.equal(entry.context.nested.authorization, '[REDACTED]')
  assert.equal(entry.context.nested.count, 2)
  assert.equal(entry.context.error.message, 'Sample error')
  assert.match(entry.context.error.stack, /Sample error/)
})

test('logError records safe diagnostics once while an error crosses layers', async () => {
  const operation = `Repository failure ${randomUUID()}`
  const error = new Error('private SQL\npassword=do-not-log')
  error.original = { code: 'ECONNREFUSED' }
  await logger.logError(error, operation)
  await logger.logError(error, 'Service failure')
  await logger.logError(error, 'Controller failure', { method: 'GET', originalUrl: '/api/books/search?q=private' })
  const expected = new ApiError(API_ERRORS.VALIDATION_ERROR)
  await logger.logError(expected, `${operation} validation`, { method: 'GET', originalUrl: '/api/books/search?q=private' })
  await logger.flush()
  const date = new Date().toISOString().slice(0, 10)
  const content = await readFile(new URL(`../logs/${date}.log`, import.meta.url), 'utf8')
  const records = content.trim().split('\n').map(line => JSON.parse(line))
  const entries = records.filter(item => item.message === operation)
  assert.equal(entries.length, 1)
  assert.equal(entries[0].level, 'error')
  assert.equal(entries[0].context.causeCode, 'ECONNREFUSED')
  assert.doesNotMatch(JSON.stringify(entries), /private SQL|do-not-log/)
  const validation = records.find(item => item.message === `${operation} validation`)
  assert.equal(validation.level, 'warn')
  assert.equal(validation.context.code, 'VALIDATION_ERROR')
  assert.equal(validation.context.path, '/api/books/search')
  assert.doesNotMatch(JSON.stringify(validation), /q=private/)
})
