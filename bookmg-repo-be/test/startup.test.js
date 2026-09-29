import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import request from 'supertest'
import app from '../app.js'

test('health and HTTP errors use JSON responses', async () => {
  await request(app).get('/api/health').expect(200, { status: 'ok' })
  await request(app).get('/missing').expect(404, { error: { message: 'Route not found' } })
  await request(app).post('/missing').set('Content-Type', 'application/json')
    .send('{').expect(400, { error: { message: 'Invalid JSON body' } })
})

test('server exits without listening when MySQL is unavailable', () => {
  const result = spawnSync(process.execPath, ['server.js'], {
    cwd: new URL('../', import.meta.url),
    env: {
      ...process.env,
      BASE_URL: 'http://127.0.0.1:13001',
      DB_HOST: '127.0.0.1', DB_PORT: '1', DB_NAME: 'test', DB_USER: 'test',
      DB_PASSWORD: 'startup-test-secret',
    },
    encoding: 'utf8',
    timeout: 10_000,
  })
  assert.ifError(result.error)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Backend startup failed:/)
  assert.doesNotMatch(result.stdout, /Backend ready/)
  assert.doesNotMatch(result.stderr, /startup-test-secret/)
})
