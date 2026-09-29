import './env.js'
import { Sequelize } from 'sequelize'

for (const key of ['DB_NAME', 'DB_USER']) {
  if (!process.env[key]?.trim()) throw new Error(`Missing ${key} in backend environment`)
}

const port = Number(process.env.DB_PORT ?? 3306)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be an integer between 1 and 65535')
}

export const databaseOptions = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  dialect: 'mysql',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port,
  logging: false,
  dialectOptions: { connectTimeout: 5000 },
}

export const sequelize = new Sequelize(databaseOptions)
