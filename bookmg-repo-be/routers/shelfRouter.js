import { Router } from 'express'
import { addBookToShelf, listShelf, getShelfBookDetail, getShelfStats, updateShelfBook, deleteShelfBook } from '../controllers/shelfController.js'

const router = Router()
router.post('/', addBookToShelf)
router.get('/', listShelf)
router.get('/stats', getShelfStats)
router.get('/:bookId', getShelfBookDetail)
router.patch('/:bookId', updateShelfBook)
router.delete('/:bookId', deleteShelfBook)

export default router
