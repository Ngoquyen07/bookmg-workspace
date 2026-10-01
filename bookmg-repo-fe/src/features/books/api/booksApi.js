import { http } from '../../../shared/api/http.js'

export const booksApi = {
  search(params) { return http.get('/api/books/search', { params }) },
  detail(workId) { return http.get(`/api/books/${encodeURIComponent(workId)}`) },
}
