import { http } from '../../../shared/api/http.js'

export const shelfApi = {
  list({ status, page = 1, limit = 10 } = {}) { return http.get('/api/shelf', { params: { ...(status ? { status } : {}), page, limit } }) },
  get(bookId) { return http.get(`/api/shelf/${encodeURIComponent(bookId)}`) },
  stats() { return http.get('/api/shelf/stats') },
  add(payload) { return http.post('/api/shelf', payload) },
  update(bookId, payload) { return http.patch(`/api/shelf/${encodeURIComponent(bookId)}`, payload) },
  remove(bookId) { return http.delete(`/api/shelf/${encodeURIComponent(bookId)}`) },
}
