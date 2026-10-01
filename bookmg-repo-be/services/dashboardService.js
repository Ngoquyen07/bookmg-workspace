import { findDashboardEntries } from '../repositories/dashboardRepository.js'
import { formatShelfEntry, getStats } from './shelfService.js'
import logger from './core/loggerService.js'

export async function getDashboard({ limit }) {
  try {
    const [stats, sections] = await Promise.all([getStats(), findDashboardEntries(limit)])
    const lists = Object.fromEntries(Object.entries(sections).map(([name, { rows, count }]) => {
      const data = rows.map(formatShelfEntry)
      return [name, { data, meta: { count: data.length, total: count, limit } }]
    }))
    return { stats, ...lists }
  } catch (error) {
    logger.logError(error, 'dashboardService.getDashboard')
    throw error
  }
}
