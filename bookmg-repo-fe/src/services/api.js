import axios from 'axios'
import { API_ERROR_MESSAGES, DEFAULT_API_ERROR_MESSAGE } from '../config/messageConfig.js'

export const api = axios.create({ baseURL: '/', timeout: 25000 })

api.interceptors.response.use(
  response => response.data,
  error => {
    const status = error.response?.status ?? 0
    const code = error.response?.data?.error?.code ?? (status ? 'HTTP_ERROR' : 'NETWORK_ERROR')
    const message = API_ERROR_MESSAGES[code] ?? error.response?.data?.error?.message ?? DEFAULT_API_ERROR_MESSAGE
    return Promise.reject(Object.assign(new Error(message), { status, code }))
  },
)
