import { API_ERRORS, HTTP_STATUS } from '../constants/responseConstants.js'

export function sendSuccess(res, data, { status = HTTP_STATUS.OK, meta } = {}) {
  const response = { data }
  if (meta !== undefined) response.meta = meta
  return res.status(status).json(response)
}

export function sendError(res, error = API_ERRORS.INTERNAL_SERVER_ERROR) {
  return res.status(error.status).json({
    error: { code: error.code, message: error.message },
  })
}
