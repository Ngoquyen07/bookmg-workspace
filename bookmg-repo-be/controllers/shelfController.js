import { addBook, listBooks, getStats, updateBook, removeBook } from '../services/shelfService.js'
import { validateAddBook, validateShelfFilter, validateShelfBookId, validateShelfUpdate } from '../validation/shelfValidation.js'
import { API_ERRORS, HTTP_STATUS } from '../constants/responseConstants.js'
import { sendSuccess, sendError } from '../utils/apiResponse.js'
import ApiError from '../utils/apiError.js'
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

export async function listShelf(req, res) {
  try {
    const data = await listBooks(validateShelfFilter(req.query))
    return sendSuccess(res, data, { meta: { count: data.length } })
  } catch (error) {
    logger.logError(error, 'shelfController.listShelf', req)
    return sendError(res, error)
  }
}

export async function getShelfStats(req, res) {
  try {
    if (Object.keys(req.query).length) throw new ApiError(API_ERRORS.VALIDATION_ERROR)
    return sendSuccess(res, await getStats())
  } catch (error) {
    logger.logError(error, 'shelfController.getShelfStats', req)
    return sendError(res, error)
  }
}

export async function updateShelfBook(req, res) {
  try {
    const bookId = validateShelfBookId(req.params, req.query)
    return sendSuccess(res, await updateBook(bookId, validateShelfUpdate(req.body)))
  } catch (error) {
    logger.logError(error, 'shelfController.updateShelfBook', req)
    return sendError(res, error)
  }
}

export async function deleteShelfBook(req, res) {
  try {
    return sendSuccess(res, await removeBook(validateShelfBookId(req.params, req.query)))
  } catch (error) {
    logger.logError(error, 'shelfController.deleteShelfBook', req)
    return sendError(res, error)
  }
}
