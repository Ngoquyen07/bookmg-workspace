import express from 'express'
import helmet from 'helmet'
import requestLogger from './middleware/requestLogger.js'
import { API_ERRORS } from './constants/responseConstants.js'
import logger from './services/core/loggerService.js'
import { sendSuccess, sendError } from './utils/apiResponse.js'
import bookRouter from './routers/bookRouter.js'
import shelfRouter from './routers/shelfRouter.js'
import dashboardRouter from './routers/dashboardRouter.js'

const app = express()

app.use(helmet())
app.use(requestLogger)
const parseJson = express.json({ limit: '100kb' })
app.use(async (req, res, next) => {
  try {
    // Reject malformed URL encoding before Express decodes route parameters.
    decodeURIComponent(req.path)
    await new Promise((resolve, reject) => {
      parseJson(req, res, error => error ? reject(error) : resolve())
    })
  } catch (error) {
    logger.logError(error, 'app.parseRequest', req)
    return sendError(res, error)
  }
  next()
})

app.get('/api/health', (_req, res) => {
  sendSuccess(res, { status: 'ok' })
})

app.use('/api/books', bookRouter)
app.use('/api/shelf', shelfRouter)
app.use('/api/dashboard', dashboardRouter)

app.use((_req, res) => {
  sendError(res, API_ERRORS.ROUTE_NOT_FOUND)
})

export default app
