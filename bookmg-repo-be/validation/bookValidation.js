import Joi from 'joi'
import { API_ERRORS } from '../constants/responseConstants.js'
import ApiError from '../utils/apiError.js'

const searchSchema = Joi.object({
  q: Joi.string().trim().min(1).max(200).required(),
  field: Joi.string().valid('all', 'title', 'author').default('all'),
  page: Joi.number().integer().min(1).max(10000).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
})
const coverSchema = Joi.object({
  coverId: Joi.string().pattern(/^[1-9]\d{0,9}$/).required(),
})
const detailSchema = Joi.object({
  workId: Joi.string().pattern(/^OL\d+W$/).max(32).required(),
})

export function validateSearch(query) {
  const { error, value } = searchSchema.validate(query)
  if (error) throw new ApiError(API_ERRORS.VALIDATION_ERROR)
  return value
}

export function validateCover(params) {
  const { error, value } = coverSchema.validate(params)
  if (error || Number(value.coverId) > 4294967295) throw new ApiError(API_ERRORS.VALIDATION_ERROR)
  return value.coverId
}

export function validateDetail(params, query) {
  const { error, value } = detailSchema.validate(params)
  if (error || Object.keys(query).length) throw new ApiError(API_ERRORS.VALIDATION_ERROR)
  return value.workId
}
