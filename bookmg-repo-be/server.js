import './config/env.js'
import app from './app.js'
import { LOG_MESSAGE } from './constants/logConstants.js'

let server
let sequelize
let stopping = false

async function shutdown(exitCode = 0) {
  if (stopping) return
  stopping = true
  process.exitCode = exitCode
  console.log(LOG_MESSAGE.SERVER_STOPPING)
  const deadline = setTimeout(() => process.exit(1), 10_000)
  deadline.unref()
  try {
    if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  } catch (error) {
    console.error(LOG_MESSAGE.SERVER_STOP_FAILED, error.code ?? error.name)
    process.exitCode = 1
  }
  try {
    await sequelize?.close()
  } catch (error) {
    console.error(LOG_MESSAGE.SERVER_STOP_FAILED, error.code ?? error.name)
    process.exitCode = 1
  }
  clearTimeout(deadline)
  if (!process.exitCode) console.log(LOG_MESSAGE.SERVER_STOPPED)
}

try {
  const baseUrl = new URL(process.env.BASE_URL ?? 'http://127.0.0.1:3000')
  if (baseUrl.protocol !== 'http:') throw new Error('Backend requires an HTTP listen URL')
  const database = await import('./config/database.js')
  sequelize = database.sequelize
  await sequelize.authenticate()
  server = await new Promise((resolve, reject) => {
    const listener = app.listen(Number(baseUrl.port || 80), baseUrl.hostname, () => resolve(listener))
    listener.once('error', reject)
  })
  console.log(`${LOG_MESSAGE.SERVER_READY}: ${baseUrl.origin}`)
} catch (error) {
  console.error(LOG_MESSAGE.SERVER_START_FAILED, error.original?.code ?? error.code ?? error.name)
  await shutdown(1)
}

if (server) {
  process.once('SIGINT', () => shutdown())
  process.once('SIGTERM', () => shutdown())
}
