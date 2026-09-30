import Joi from 'joi'
import { READING_STATUS } from '../constants/bookConstants.js'
import { API_ERRORS } from '../constants/responseConstants.js'
import ApiError from '../utils/apiError.js'

const addSchema = Joi.object({
  workId: Joi.string().pattern(/^OL\d+W$/).max(32).required(),
  status: Joi.string().valid(...Object.values(READING_STATUS)).default(READING_STATUS.WANT_TO_READ),
  editionId: Joi.string().pattern(/^OL\d+M$/).max(32).optional(),
})
const listSchema = Joi.object({
  status: Joi.string().valid(...Object.values(READING_STATUS)),
})

export function validateAddBook(body) {
  const { error, value } = addSchema.validate(body)
  if (error) throw new ApiError(API_ERRORS.VALIDATION_ERROR)
  return value
}

export function validateShelfFilter(query) {
  const { error, value } = listSchema.validate(query)
  if (error) throw new ApiError(API_ERRORS.VALIDATION_ERROR)
  return value.status
}
