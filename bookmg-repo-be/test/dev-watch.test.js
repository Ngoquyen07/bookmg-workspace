import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

test('dev watcher recovers when an imported file with a syntax error is fixed', { timeout: 15000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bookmg-dev-watch-'))
  const repository = join(directory, 'repository.js')
  await writeFile(join(directory, 'package.json'), '{"type":"module"}')
  await writeFile(join(directory, 'server.js'), "import './repository.js'; console.log('WATCH_TEST_READY')")
  await writeFile(repository, 'const new Set([])')
  const child = spawn(process.execPath, [
    fileURLToPath(new URL('../node_modules/nodemon/bin/nodemon.js', import.meta.url)),
    '--config', fileURLToPath(new URL('../nodemon.json', import.meta.url)), 'server.js',
  ], { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', data => { output += data })
  child.stderr.on('data', data => { output += data })
  async function waitFor(message) {
    const deadline = Date.now() + 5000
    while (!output.includes(message) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    assert.ok(output.includes(message), `Missing ${message}: ${output}`)
  }
  try {
    await waitFor('app crashed')
    await writeFile(repository, 'const books = new Set([])')
    await waitFor('WATCH_TEST_READY')
    // The fixture exits after printing; only the watcher remains to stop.
    await waitFor('clean exit')
  } finally {
    const exited = new Promise(resolve => child.once('exit', resolve))
    child.kill()
    await exited
    await rm(directory, { recursive: true, force: true })
  }
})
