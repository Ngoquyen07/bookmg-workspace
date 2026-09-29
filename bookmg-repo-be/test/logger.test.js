import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import logger from '../services/core/loggerService.js'

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
