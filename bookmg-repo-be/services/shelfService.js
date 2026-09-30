import * as openLibrary from '../adapters/openLibraryAdapter.js'
import { addBookToShelf, findShelfBookIds, listShelfEntries, countShelfEntriesByStatus, updateShelfEntry, deleteShelfBook } from '../repositories/shelfRepository.js'
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

export async function updateBook(bookId, changes) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    return await updateShelfEntry(bookId, entry => {
      const total = entry.totalPages
      if (total !== null && changes.currentPage !== undefined && changes.currentPage > total) {
        throw new ApiError(API_ERRORS.VALIDATION_ERROR)
      }
      if (changes.status === READING_STATUS.FINISHED && total !== null &&
          changes.currentPage !== undefined && changes.currentPage !== total) {
        throw new ApiError(API_ERRORS.VALIDATION_ERROR)
      }

      if (changes.currentPage !== undefined) entry.currentPage = changes.currentPage
      if (changes.status === READING_STATUS.FINISHED && total !== null) entry.currentPage = total
      if (changes.rating !== undefined) entry.rating = changes.rating
      if (changes.notes !== undefined) entry.notes = changes.notes

      let status = changes.status ?? entry.status
      if (total !== null && entry.currentPage === total) status = READING_STATUS.FINISHED
      else if (changes.currentPage !== undefined && entry.status === READING_STATUS.FINISHED &&
          changes.status === undefined) status = READING_STATUS.READING

      if (status === READING_STATUS.READING && !entry.startedAt) entry.startedAt = today
      if (status === READING_STATUS.FINISHED && (entry.status !== READING_STATUS.FINISHED || !entry.finishedAt)) {
        entry.finishedAt = today
      }
      if (status !== READING_STATUS.FINISHED) entry.finishedAt = null
      entry.status = status
    })
  } catch (error) {
    logger.logError(error, 'shelfService.updateBook')
    throw error
  }
}

export async function removeBook(bookId) {
  try {
    return await deleteShelfBook(bookId)
  } catch (error) {
    logger.logError(error, 'shelfService.removeBook')
    throw error
  }
}
