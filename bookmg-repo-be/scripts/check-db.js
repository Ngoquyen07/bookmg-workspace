import logger from '../services/core/loggerService.js'

let sequelize

try {
  const database = await import('../config/database.js')
  sequelize = database.sequelize
  await sequelize.authenticate()
  console.log('MySQL connection OK (Sequelize)')
} catch (error) {
  logger.logError(error, 'MySQL connection failed')
  process.exitCode = 1
} finally {
  try {
    await sequelize?.close()
  } catch (error) {
    logger.logError(error, 'MySQL cleanup failed')
    process.exitCode = 1
  } finally {
    await logger.flush()
  }
}
