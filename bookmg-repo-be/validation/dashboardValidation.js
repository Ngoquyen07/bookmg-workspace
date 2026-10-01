import Joi from 'joi'
import { DASHBOARD_DEFAULT_LIMIT, DASHBOARD_MAX_LIMIT } from '../constants/dashboardConstants.js'
import { API_ERRORS } from '../constants/responseConstants.js'
import ApiError from '../utils/apiError.js'

const dashboardSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(DASHBOARD_MAX_LIMIT).default(DASHBOARD_DEFAULT_LIMIT),
})

export function validateDashboardQuery(query) {
  const { value, error } = dashboardSchema.validate(query)
  if (error) throw new ApiError(API_ERRORS.VALIDATION_ERROR)
  return value
}
