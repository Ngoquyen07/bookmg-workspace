import { Router } from 'express'
import { searchBooks, getCover, getBookDetail } from '../controllers/bookController.js'

const router = Router()
router.get('/search', searchBooks)
router.get('/covers/:coverId', getCover)
router.get('/:workId', getBookDetail)

export default router
