import { API_ERRORS, HTTP_STATUS } from '../constants/responseConstants.js'
import { LOG_LEVEL, LOG_MESSAGE } from '../constants/logConstants.js'
import { sendError } from '../utils/apiResponse.js'
import logger from '../services/core/loggerService.js'

export default function errorHandler(error, req, res, next) {
  const responseError = error.type === 'entity.parse.failed' ? API_ERRORS.INVALID_JSON
    : error.type === 'entity.too.large' ? API_ERRORS.PAYLOAD_TOO_LARGE
      : API_ERRORS.INTERNAL_SERVER_ERROR
  const level = responseError.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN
  // Do not expose error messages, parser bodies, SQL or connection details.
  logger[level](LOG_MESSAGE.HTTP_FAILED, {
    method: req.method,
    path: req.path,
    code: responseError.code,
    name: error.name,
    stack: error.stack?.split('\n').slice(1).join('\n'),
  })
  if (res.headersSent) return next(error)
  return sendError(res, responseError)
}
