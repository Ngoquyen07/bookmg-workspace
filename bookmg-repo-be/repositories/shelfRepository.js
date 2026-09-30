import { Op, UniqueConstraintError } from 'sequelize'
import logger from '../services/core/loggerService.js'
import { API_ERRORS } from '../constants/responseConstants.js'
import ApiError from '../utils/apiError.js'

export async function findShelfBookIds(bookIds) {
  if (bookIds.length === 0) return new Set()
  try {
    // Load the database only when needed; health checks require no database config.
    const { ShelfEntry } = await import('../models/index.js')
    const entries = await ShelfEntry.findAll({
      attributes: ['bookId'], where: { bookId: { [Op.in]: bookIds } }, raw: true,
    })
    return new Set(entries.map(entry => entry.bookId))
  } catch (error) {
    logger.logError(error, 'shelfRepository.findShelfBookIds')
    throw error
  }
}

export async function addBookToShelf(bookData, shelfData) {
  try {
    const { sequelize } = await import('../config/database.js')
    const { Book, ShelfEntry } = await import('../models/index.js')
    return await sequelize.transaction(async transaction => {
      const [book] = await Book.findOrCreate({
        where: { id: bookData.id }, defaults: bookData, transaction,
      })
      const entry = await ShelfEntry.create({ bookId: book.id, ...shelfData }, { transaction })
      return { book: book.toJSON(), shelfEntry: entry.toJSON() }
    })
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      const conflict = new ApiError(API_ERRORS.BOOK_ALREADY_IN_SHELF, { cause: error })
      logger.logError(conflict, 'shelfRepository.addBookToShelf')
      throw conflict
    }
    logger.logError(error, 'shelfRepository.addBookToShelf')
    throw error
  }
}

export async function findShelfEntryByBookId(bookId) {
  try {
    const { ShelfEntry } = await import('../models/index.js')
    return await ShelfEntry.findOne({
      attributes: ['editionId', 'totalPages'], where: { bookId }, raw: true,
    })
  } catch (error) {
    logger.logError(error, 'shelfRepository.findShelfEntryByBookId')
    throw error
  }
}

export async function listShelfEntries(status) {
  try {
    const { Book, ShelfEntry } = await import('../models/index.js')
    return await ShelfEntry.findAll({
      where: status ? { status } : {},
      include: { model: Book, as: 'book' },
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
    })
  } catch (error) {
    logger.logError(error, 'shelfRepository.listShelfEntries')
    throw error
  }
}

export async function countShelfEntriesByStatus() {
  try {
    const { ShelfEntry } = await import('../models/index.js')
    return await ShelfEntry.count({ group: ['status'] })
  } catch (error) {
    logger.logError(error, 'shelfRepository.countShelfEntriesByStatus')
    throw error
  }
}

export async function updateShelfEntry(bookId, applyChanges) {
  try {
    const { sequelize } = await import('../config/database.js')
    const { ShelfEntry } = await import('../models/index.js')
    return await sequelize.transaction(async transaction => {
      const entry = await ShelfEntry.findOne({
        where: { bookId }, transaction, lock: transaction.LOCK.UPDATE,
      })
      if (!entry) throw new ApiError(API_ERRORS.SHELF_ENTRY_NOT_FOUND)
      applyChanges(entry)
      await entry.save({ transaction })
      return entry.toJSON()
    })
  } catch (error) {
    logger.logError(error, 'shelfRepository.updateShelfEntry')
    throw error
  }
}

export async function deleteShelfBook(bookId) {
  try {
    const { sequelize } = await import('../config/database.js')
    const { Book, ShelfEntry } = await import('../models/index.js')
    return await sequelize.transaction(async transaction => {
      const removed = await ShelfEntry.destroy({ where: { bookId }, transaction })
      if (!removed) throw new ApiError(API_ERRORS.SHELF_ENTRY_NOT_FOUND)
      await Book.destroy({ where: { id: bookId }, transaction })
      return { bookId, removed: true }
    })
  } catch (error) {
    logger.logError(error, 'shelfRepository.deleteShelfBook')
    throw error
  }
}
