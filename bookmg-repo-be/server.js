import './config/env.js'
import app from './app.js'
import { sequelize } from './config/database.js'
import logger from './services/core/loggerService.js'
import { LOG_MESSAGE } from './constants/logConstants.js'

let server

try {
  const baseUrl = new URL(process.env.BASE_URL ?? 'http://127.0.0.1:3000')
  if (baseUrl.protocol !== 'http:') throw new Error('Backend requires an HTTP listen URL')
  await sequelize.authenticate()
  server = await new Promise((resolve, reject) => {
    const listener = app.listen(Number(baseUrl.port || 80), baseUrl.hostname, () => resolve(listener))
    listener.once('error', reject)
  })
  logger.info(LOG_MESSAGE.SERVER_READY, { baseUrl: baseUrl.origin })
} catch (error) {
  logger.error(LOG_MESSAGE.SERVER_START_FAILED, { code: error.original?.code ?? error.code ?? error.name })
  await sequelize.close()
  await logger.flush()
  process.exitCode = 1
}

if (server) {
  let stopping = false
  async function shutdown() {
    if (stopping) return
    stopping = true
    logger.info(LOG_MESSAGE.SERVER_STOPPING)
    const deadline = setTimeout(() => process.exit(1), 10_000)
    deadline.unref()
    try {
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
      await sequelize.close()
      logger.info(LOG_MESSAGE.SERVER_STOPPED)
    } catch {
      logger.error(LOG_MESSAGE.SERVER_STOP_FAILED)
      process.exitCode = 1
    } finally {
      await logger.flush()
      clearTimeout(deadline)
    }
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}
