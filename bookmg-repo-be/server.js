import './config/env.js'
import app from './app.js'
import logger from './services/core/loggerService.js'
import { LOG_MESSAGE } from './constants/logConstants.js'

let server
let sequelize

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
  logger.info(LOG_MESSAGE.SERVER_READY, { baseUrl: baseUrl.origin })
} catch (error) {
  logger.logError(error, LOG_MESSAGE.SERVER_START_FAILED)
  process.exitCode = 1
  try {
    await sequelize?.close()
  } catch (closeError) {
    logger.logError(closeError, LOG_MESSAGE.SERVER_STOP_FAILED)
  } finally {
    await logger.flush()
  }
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
    } catch (error) {
      logger.logError(error, LOG_MESSAGE.SERVER_STOP_FAILED)
      process.exitCode = 1
    } finally {
      try {
        await sequelize.close()
        if (!process.exitCode) logger.info(LOG_MESSAGE.SERVER_STOPPED)
      } catch (error) {
        logger.logError(error, LOG_MESSAGE.SERVER_STOP_FAILED)
        process.exitCode = 1
      }
      await logger.flush()
      clearTimeout(deadline)
    }
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}
