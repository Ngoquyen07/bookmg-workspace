import { Router } from 'express'
import { addBookToShelf } from '../controllers/shelfController.js'

const router = Router()
router.post('/', addBookToShelf)

export default router
