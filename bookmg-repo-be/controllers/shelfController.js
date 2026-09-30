import { addBook } from '../services/shelfService.js'
import { validateAddBook } from '../validation/shelfValidation.js'
import { HTTP_STATUS } from '../constants/responseConstants.js'
import { sendSuccess, sendError } from '../utils/apiResponse.js'
import logger from '../services/core/loggerService.js'

export async function addBookToShelf(req, res) {
  try {
    const result = await addBook(validateAddBook(req.body))
    return sendSuccess(res, result, { status: HTTP_STATUS.CREATED })
  } catch (error) {
    logger.logError(error, 'shelfController.addBookToShelf', req)
    return sendError(res, error)
  }
}
