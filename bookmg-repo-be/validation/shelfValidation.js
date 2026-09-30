import Joi from 'joi'
import { MAX_NOTE_LENGTH, READING_STATUS } from '../constants/bookConstants.js'
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
const bookIdSchema = Joi.string().pattern(/^OL\d+W$/).max(32).required()
const updateSchema = Joi.object({
  currentPage: Joi.number().integer().min(0).max(4294967295),
  status: Joi.string().valid(...Object.values(READING_STATUS)),
  rating: Joi.number().integer().min(1).max(5).allow(null),
  notes: Joi.string().max(MAX_NOTE_LENGTH).allow('', null),
}).min(1).strict()

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

export function validateShelfBookId(params, query) {
  const { error, value } = bookIdSchema.validate(params.bookId)
  if (error || Object.keys(query).length) throw new ApiError(API_ERRORS.VALIDATION_ERROR)
  return value
}

export function validateShelfUpdate(body) {
  const { error, value } = updateSchema.validate(body)
  if (error) throw new ApiError(API_ERRORS.VALIDATION_ERROR)
  return value
}
