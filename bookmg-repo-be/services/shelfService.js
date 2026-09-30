import * as openLibrary from '../adapters/openLibraryAdapter.js'
import { addBookToShelf, findShelfBookIds } from '../repositories/shelfRepository.js'
import { API_ERRORS } from '../constants/responseConstants.js'
import { READING_STATUS } from '../constants/bookConstants.js'
import ApiError from '../utils/apiError.js'
import logger from './core/loggerService.js'

export async function addBook({ workId, status, editionId }) {
  try {
    if ((await findShelfBookIds([workId])).has(workId)) throw new ApiError(API_ERRORS.BOOK_ALREADY_IN_SHELF)
    const book = await openLibrary.getWork(workId)
    const edition = editionId ? await openLibrary.getEdition(editionId, workId) : { editionId: null, totalPages: null }
    const today = new Date().toISOString().slice(0, 10)
    return await addBookToShelf(book, {
      ...edition, status,
      currentPage: status === READING_STATUS.FINISHED ? edition.totalPages ?? 0 : 0,
      startedAt: status === READING_STATUS.READING ? today : null,
      finishedAt: status === READING_STATUS.FINISHED ? today : null,
    })
  } catch (error) {
    logger.logError(error, 'shelfService.addBook')
    throw error
  }
}
