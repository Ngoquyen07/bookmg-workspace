import express from 'express'
import helmet from 'helmet'

const app = express()

app.use(helmet())
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } })
})

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error)
  const status = error.status === 400 || error.status === 413 ? error.status : 500
  const message = status === 400 ? 'Invalid JSON body'
    : status === 413 ? 'Request body too large' : 'Internal server error'
  res.status(status).json({ error: { message } })
})

export default app
