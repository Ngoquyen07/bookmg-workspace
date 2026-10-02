import * as openLibrary from '../adapters/openLibraryAdapter.js'
import { findShelfBookIds, findShelfEntryByBookId } from '../repositories/shelfRepository.js'
import logger from './core/loggerService.js'

export async function searchBooks(query) {
  try {
    const { books, total } = await openLibrary.searchBooks(query)
    const shelfBookIds = await findShelfBookIds(books.map(book => book.id))
    const data = books.map(book => ({ ...book, isInShelf: shelfBookIds.has(book.id) }))
    return {
      data,
      meta: { page: query.page, limit: query.limit, count: data.length, total, totalPages: Math.ceil(total / query.limit) },
    }
  } catch (error) {
    logger.logError(error, 'bookService.searchBooks')
    throw error
  }
}

export async function getCover(coverId) {
  try {
    return await openLibrary.getCover(coverId)
  } catch (error) {
    logger.logError(error, 'bookService.getCover')
    throw error
  }
}

export async function getBookDetail(workId) {
  try {
    const [book, shelfEntry] = await Promise.all([
      openLibrary.getWork(workId), findShelfEntryByBookId(workId),
    ])
    const edition = shelfEntry ?? await openLibrary.getSuggestedEdition(workId)
    const readingUrl = edition.readingUrl ?? await openLibrary.getReadingUrl(edition.editionId, workId)
    return {
      ...book,
      coverUrl: book.coverId === null ? null : `/api/books/covers/${book.coverId}`,
      ...edition,
      readingUrl,
      isInShelf: shelfEntry !== null,
    }
  } catch (error) {
    logger.logError(error, 'bookService.getBookDetail')
    throw error
  }
}
