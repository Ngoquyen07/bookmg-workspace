import { sequelize } from '../config/database.js'

try {
  await sequelize.authenticate()
  console.log('MySQL connection OK (Sequelize)')
} catch (error) {
  console.error('MySQL connection failed:', error.original?.code ?? error.name)
  process.exitCode = 1
} finally {
  await sequelize.close()
}
