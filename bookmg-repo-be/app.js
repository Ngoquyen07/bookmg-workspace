import express from 'express'
import helmet from 'helmet'
import requestLogger from './middleware/requestLogger.js'
import errorHandler from './middleware/errorHandler.js'
import { API_ERRORS } from './constants/responseConstants.js'
import { sendSuccess, sendError } from './utils/apiResponse.js'

const app = express()

app.use(helmet())
app.use(requestLogger)
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  sendSuccess(res, { status: 'ok' })
})

app.use((_req, res) => {
  sendError(res, API_ERRORS.ROUTE_NOT_FOUND)
})

app.use(errorHandler)

export default app
