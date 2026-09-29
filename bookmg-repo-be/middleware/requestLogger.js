import logger from '../services/core/loggerService.js'
import { LOG_LEVEL, LOG_MESSAGE } from '../constants/logConstants.js'
import { HTTP_STATUS } from '../constants/responseConstants.js'

export default function requestLogger(req, res, next) {
  const started = performance.now()
  res.once('finish', () => {
    const level = res.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR ? LOG_LEVEL.ERROR
      : res.statusCode >= HTTP_STATUS.BAD_REQUEST ? LOG_LEVEL.WARN : LOG_LEVEL.INFO
    logger[level](LOG_MESSAGE.HTTP_COMPLETED, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round((performance.now() - started) * 100) / 100,
    })
  })
  next()
}
