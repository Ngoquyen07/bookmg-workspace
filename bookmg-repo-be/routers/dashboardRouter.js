import { Router } from 'express'
import { getReadingDashboard } from '../controllers/dashboardController.js'

const router = Router()
router.get('/', getReadingDashboard)
export default router
