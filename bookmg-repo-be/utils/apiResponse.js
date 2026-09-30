import { API_ERRORS, HTTP_STATUS } from '../constants/responseConstants.js'
import { getErrorDescriptor } from './apiError.js'

export function sendSuccess(res, data, { status = HTTP_STATUS.OK, meta } = {}) {
  const response = { data }
  if (meta !== undefined) response.meta = meta
  return res.status(status).json(response)
}

export function sendError(res, error = API_ERRORS.INTERNAL_SERVER_ERROR) {
  if (res.headersSent) return res.destroy()
  const descriptor = getErrorDescriptor(error)
  return res.status(descriptor.status).json({
    error: { code: descriptor.code, message: descriptor.message },
  })
}
