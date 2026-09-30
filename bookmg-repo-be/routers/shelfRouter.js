import { Router } from 'express'
import { addBookToShelf, listShelf, getShelfStats, updateShelfBook, deleteShelfBook } from '../controllers/shelfController.js'

const router = Router()
router.post('/', addBookToShelf)
router.get('/', listShelf)
router.get('/stats', getShelfStats)
router.patch('/:bookId', updateShelfBook)
router.delete('/:bookId', deleteShelfBook)

export default router
