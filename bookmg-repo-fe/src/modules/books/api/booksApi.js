import { api } from '../../../services/api.js'

export const booksApi = {
  search(params) { return api.get('/api/books/search', { params }) },
  detail(workId) { return api.get(`/api/books/${encodeURIComponent(workId)}`) },
}
