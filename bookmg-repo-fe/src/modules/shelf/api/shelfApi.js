import { api } from '../../../services/api.js'

export const shelfApi = {
  list({ status, page = 1, limit = 10 } = {}) { return api.get('/api/shelf', { params: { ...(status ? { status } : {}), page, limit } }) },
  get(bookId) { return api.get(`/api/shelf/${encodeURIComponent(bookId)}`) },
  stats() { return api.get('/api/shelf/stats') },
  add(payload) { return api.post('/api/shelf', payload) },
  update(bookId, payload) { return api.patch(`/api/shelf/${encodeURIComponent(bookId)}`, payload) },
  remove(bookId) { return api.delete(`/api/shelf/${encodeURIComponent(bookId)}`) },
}
