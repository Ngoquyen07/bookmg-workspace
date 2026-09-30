import { Router } from 'express'
import { searchBooks, getCover } from '../controllers/bookController.js'

const router = Router()
router.get('/search', searchBooks)
router.get('/covers/:coverId', getCover)

export default router
