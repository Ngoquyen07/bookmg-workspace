import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import request from 'supertest'
import app from '../app.js'

test('health and HTTP errors use JSON responses', async () => {
  await request(app).get('/api/health').expect(200, { status: 200, data: { status: 'ok' } })
  await request(app).get('/missing').expect(404, { status: 404, error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } })
  await request(app).post('/missing').set('Content-Type', 'application/json')
    .send('{').expect(400, { status: 400, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } })
  await request(app).post('/missing').send({ value: 'x'.repeat(110_000) })
    .expect(413, { status: 413, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } })
  await request(app).get('/api/books/covers/%ZZ')
    .expect(400, { status: 400, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' } })
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
  assert.match(result.stderr, /Backend startup failed/)
  assert.doesNotMatch(result.stdout, /Backend ready/)
  assert.doesNotMatch(result.stderr, /startup-test-secret/)
})

test('invalid database configuration is caught and logged during startup', () => {
  for (const override of [{ DB_NAME: '' }, { DB_PORT: 'invalid' }]) {
    const result = spawnSync(process.execPath, ['server.js'], {
      cwd: new URL('../', import.meta.url),
      env: { ...process.env, DB_NAME: 'test', DB_USER: 'test', ...override },
      encoding: 'utf8', timeout: 10_000,
    })
    assert.ifError(result.error)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Backend startup failed/)
    assert.doesNotMatch(result.stdout, /Backend ready/)
    assert.doesNotMatch(result.stderr, /UnhandledPromiseRejection/)
    assert.match(result.stderr, /Backend startup failed Error/)
  }
})

test('startup handles listen failures and shutdown closes HTTP before MySQL', () => {
  for (const scenario of ['normal', 'listen-error', 'close-error']) {
    const result = spawnSync(process.execPath, ['--input-type=module'], {
      cwd: new URL('../', import.meta.url),
      env: { ...process.env, DB_NAME: 'test', DB_USER: 'test', DB_PORT: '3306', SCENARIO: scenario },
      encoding: 'utf8', timeout: 10_000,
      input: `
        import { EventEmitter } from 'node:events'
        import app from './app.js'
        import { sequelize } from './config/database.js'
        sequelize.authenticate = async () => console.log('mysql-authenticated')
        sequelize.close = async () => console.log('mysql-closed')
        app.listen = (_port, _host, ready) => {
          const server = new EventEmitter()
          server.close = done => {
            console.log('http-closed')
            done(process.env.SCENARIO === 'close-error' ? new Error('Close failed') : null)
          }
          process.nextTick(() => process.env.SCENARIO === 'listen-error'
            ? server.emit('error', Object.assign(new Error('Listen failed'), { code: 'EADDRINUSE' })) : ready())
          return server
        }
        await import('./server.js')
        process.emit('SIGTERM')
        process.emit('SIGINT')
      `,
    })
    assert.ifError(result.error)
    assert.equal(result.status, scenario === 'normal' ? 0 : 1)
    assert.match(result.stdout, /mysql-authenticated/)
    assert.equal(result.stdout.match(/mysql-closed/g)?.length, 1)
    if (scenario === 'listen-error') {
      assert.match(result.stderr, /Backend startup failed EADDRINUSE/)
      assert.doesNotMatch(result.stdout, /Backend ready/)
    } else {
      assert.match(result.stdout, /http-closed[\s\S]*mysql-closed/)
      assert.equal(result.stdout.match(/http-closed/g)?.length, 1)
    }
  }
})
