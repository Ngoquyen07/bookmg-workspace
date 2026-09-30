import * as openLibrary from '../adapters/openLibraryAdapter.js'
import { addBookToShelf, findShelfBookIds, listShelfEntries, countShelfEntriesByStatus } from '../repositories/shelfRepository.js'
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

export async function listBooks(status) {
  try {
    const entries = await listShelfEntries(status)
    return entries.map(entry => {
      const { book, ...shelfEntry } = entry.toJSON()
      return {
        book: {
          ...book,
          coverUrl: book.coverId === null ? null : `/api/books/covers/${book.coverId}`,
        },
        shelfEntry,
        progressPercent: shelfEntry.totalPages === null
          ? null : Math.round(shelfEntry.currentPage / shelfEntry.totalPages * 100),
      }
    })
  } catch (error) {
    logger.logError(error, 'shelfService.listBooks')
    throw error
  }
}

export async function getStats() {
  try {
    const counts = Object.fromEntries(
      (await countShelfEntriesByStatus()).map(row => [row.status, Number(row.count)]),
    )
    const wantToRead = counts[READING_STATUS.WANT_TO_READ] ?? 0
    const reading = counts[READING_STATUS.READING] ?? 0
    const finished = counts[READING_STATUS.FINISHED] ?? 0
    return { total: wantToRead + reading + finished, wantToRead, reading, finished }
  } catch (error) {
    logger.logError(error, 'shelfService.getStats')
    throw error
  }
}
