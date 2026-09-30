import { Op } from 'sequelize'
import logger from '../services/core/loggerService.js'

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
