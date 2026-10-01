import { API_ERRORS } from '../constants/responseConstants.js'

export default class ApiError extends Error {
  constructor(descriptor, options) {
    super(descriptor.message, options)
    this.name = 'ApiError'
    this.descriptor = descriptor
  }
}

export function getErrorDescriptor(error) {
  if (Object.values(API_ERRORS).includes(error)) return error
  if (error instanceof ApiError) return error.descriptor
  if (error instanceof URIError) return API_ERRORS.VALIDATION_ERROR
  if (error?.type === 'entity.parse.failed') return API_ERRORS.INVALID_JSON
  if (error?.type === 'entity.too.large') return API_ERRORS.PAYLOAD_TOO_LARGE
  return API_ERRORS.INTERNAL_SERVER_ERROR
}
