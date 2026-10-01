import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import test from 'node:test'
import { createServer } from 'vite'

test('Vite proxies /api to Express', { timeout: 15000 }, async () => {
  const originalBase = process.env.BASE_URL
  const originalApi = process.env.API_BASE_URL
  process.env.BASE_URL = 'http://127.0.0.1:15173'
  process.env.API_BASE_URL = 'http://127.0.0.1:13000'
  const backend = spawn(process.execPath, ['--input-type=module', '-e', `
    import app from './app.js'
    app.listen(13000, '127.0.0.1', () => console.log('ready'))
  `], {
    cwd: new URL('../../bookmg-repo-be/', import.meta.url),
    env: { ...process.env, BASE_URL: process.env.API_BASE_URL },
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  let frontend
  try {
    await once(backend.stdout, 'data', { signal: AbortSignal.timeout(10000) })
    frontend = await createServer()
    await frontend.listen()
    const response = await fetch('http://127.0.0.1:15173/api/health')
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 200, data: { status: 'ok' } })
  } finally {
    await frontend?.close()
    backend.kill()
    if (originalBase === undefined) delete process.env.BASE_URL
    else process.env.BASE_URL = originalBase
    if (originalApi === undefined) delete process.env.API_BASE_URL
    else process.env.API_BASE_URL = originalApi
  }
})
