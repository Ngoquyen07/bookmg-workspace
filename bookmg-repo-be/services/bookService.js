import * as openLibrary from '../adapters/openLibraryAdapter.js'
import { findShelfBookIds } from '../repositories/shelfRepository.js'
import logger from './core/loggerService.js'

export async function searchBooks(query) {
  try {
    const { books, total } = await openLibrary.searchBooks(query)
    const shelfBookIds = await findShelfBookIds(books.map(book => book.id))
    return {
      data: books.map(book => ({ ...book, isInShelf: shelfBookIds.has(book.id) })),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
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
