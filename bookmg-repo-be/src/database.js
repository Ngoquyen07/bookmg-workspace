import { Sequelize } from 'sequelize'

for (const key of ['DB_NAME', 'DB_USER']) {
  if (!process.env[key]) throw new Error(`Missing ${key} in backend .env`)
}

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD ?? '',
  {
    dialect: 'mysql',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    logging: false,
  },
)
