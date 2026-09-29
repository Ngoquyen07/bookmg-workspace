import './config/env.js'
import app from './app.js'
import { sequelize } from './config/database.js'

let server

try {
  const baseUrl = new URL(process.env.BASE_URL ?? 'http://127.0.0.1:3000')
  if (baseUrl.protocol !== 'http:') throw new Error('Backend requires an HTTP listen URL')
  await sequelize.authenticate()
  server = await new Promise((resolve, reject) => {
    const listener = app.listen(Number(baseUrl.port || 80), baseUrl.hostname, () => resolve(listener))
    listener.once('error', reject)
  })
  console.log(`Backend ready at ${baseUrl.origin}; MySQL connected`)
} catch (error) {
  console.error('Backend startup failed:', error.original?.code ?? error.code ?? error.name)
  await sequelize.close()
  process.exitCode = 1
}

if (server) {
  let stopping = false
  async function shutdown() {
    if (stopping) return
    stopping = true
    const deadline = setTimeout(() => process.exit(1), 10_000)
    deadline.unref()
    try {
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
      await sequelize.close()
    } catch {
      console.error('Backend shutdown failed')
      process.exitCode = 1
    } finally {
      clearTimeout(deadline)
    }
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}
