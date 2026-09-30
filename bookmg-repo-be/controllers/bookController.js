import * as bookService from '../services/bookService.js'
import { validateSearch, validateCover } from '../validation/bookValidation.js'
import { sendSuccess, sendError } from '../utils/apiResponse.js'
import logger from '../services/core/loggerService.js'

export async function searchBooks(req, res) {
  try {
    const { data, meta } = await bookService.searchBooks(validateSearch(req.query))
    return sendSuccess(res, data, { meta })
  } catch (error) {
    logger.logError(error, 'bookController.searchBooks', req)
    return sendError(res, error)
  }
}

export async function getCover(req, res) {
  try {
    const bytes = await bookService.getCover(validateCover(req.params))
    return res.set('Cache-Control', 'public, max-age=86400').type('image/jpeg').send(bytes)
  } catch (error) {
    logger.logError(error, 'bookController.getCover', req)
    return sendError(res, error)
  }
}
