import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import test from 'node:test'
import { createServer } from 'vite'

test('FE proxies /api to BE using environment URLs', { timeout: 15000 }, async () => {
  const previousBaseUrl = process.env.BASE_URL
  const previousApiUrl = process.env.API_BASE_URL
  process.env.BASE_URL = 'http://127.0.0.1:15173'
  process.env.API_BASE_URL = 'http://127.0.0.1:13000'

  // Test HTTP routing independently of MySQL; server.js checks DB readiness separately.
  const backend = spawn(process.execPath, ['--input-type=module', '-e', `
    import app from './app.js'
    const url = new URL(process.env.BASE_URL)
    app.listen(Number(url.port), url.hostname, () => console.log('HTTP fixture ready'))
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
    assert.equal(frontend.config.server.host, '127.0.0.1')
    assert.equal(frontend.config.server.port, 15173)
    const response = await fetch(`${process.env.BASE_URL}/api/health`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { data: { status: 'ok' } })
  } finally {
    await frontend?.close()
    backend.kill()
    if (previousBaseUrl === undefined) delete process.env.BASE_URL
    else process.env.BASE_URL = previousBaseUrl
    if (previousApiUrl === undefined) delete process.env.API_BASE_URL
    else process.env.API_BASE_URL = previousApiUrl
  }
})
