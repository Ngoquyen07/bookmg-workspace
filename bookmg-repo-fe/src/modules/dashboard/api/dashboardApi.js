import { api } from '../../../services/api.js'

export const dashboardApi = {
  get() { return api.get('/api/dashboard') },
}
