import { Op, fn, col, literal, where } from 'sequelize'
import { READING_STATUS } from '../constants/bookConstants.js'
import { NEARLY_FINISHED_RATIO } from '../constants/dashboardConstants.js'
import logger from '../services/core/loggerService.js'

export async function findDashboardEntries(limit) {
  try {
    const { Book, ShelfEntry } = await import('../models/index.js')
    const options = {
      attributes: ['id', 'bookId', 'status', 'currentPage', 'totalPages', 'rating', 'startedAt', 'finishedAt', 'lastProgressAt', 'createdAt'],
      include: { model: Book, as: 'book', attributes: ['id', 'title', 'authors', 'coverId'] },
      limit, distinct: true,
    }
    const activity = fn('COALESCE', col('ShelfEntry.lastProgressAt'), col('ShelfEntry.startedAt'), col('ShelfEntry.createdAt'))
    // Fixed ORM expression: client input never becomes SQL text.
    const ratio = literal('`ShelfEntry`.`currentPage` / NULLIF(`ShelfEntry`.`totalPages`, 0)')
    const [continueReading, nearlyFinished, recentlyFinished] = await Promise.all([
      ShelfEntry.findAndCountAll({
        ...options, where: { status: READING_STATUS.READING },
        order: [[activity, 'DESC'], ['id', 'DESC']],
      }),
      ShelfEntry.findAndCountAll({
        ...options,
        where: {
          status: READING_STATUS.READING, totalPages: { [Op.gt]: 0 },
          [Op.and]: [where(ratio, { [Op.gte]: NEARLY_FINISHED_RATIO, [Op.lt]: 1 })],
        },
        order: [[ratio, 'DESC'], [activity, 'DESC'], ['id', 'DESC']],
      }),
      ShelfEntry.findAndCountAll({
        ...options, where: { status: READING_STATUS.FINISHED },
        order: [['finishedAt', 'DESC'], ['id', 'DESC']],
      }),
    ])
    return { continueReading, nearlyFinished, recentlyFinished }
  } catch (error) {
    logger.logError(error, 'dashboardRepository.findDashboardEntries')
    throw error
  }
}
