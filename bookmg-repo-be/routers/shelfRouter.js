import { Router } from 'express'
import { addBookToShelf, listShelf, getShelfStats } from '../controllers/shelfController.js'

const router = Router()
router.post('/', addBookToShelf)
router.get('/', listShelf)
router.get('/stats', getShelfStats)

export default router
