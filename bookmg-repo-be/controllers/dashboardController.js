import { validateDashboardQuery } from '../validation/dashboardValidation.js'
import { getDashboard } from '../services/dashboardService.js'
import { sendSuccess, sendError } from '../utils/apiResponse.js'
import logger from '../services/core/loggerService.js'

export async function getReadingDashboard(req, res) {
  try {
    return sendSuccess(res, await getDashboard(validateDashboardQuery(req.query)))
  } catch (error) {
    logger.logError(error, 'dashboardController.getReadingDashboard', req)
    return sendError(res, error)
  }
}
