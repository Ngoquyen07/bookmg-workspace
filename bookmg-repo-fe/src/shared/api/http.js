import axios from 'axios'

export const http = axios.create({ baseURL: '/', timeout: 25000 })

const messages = {
  VALIDATION_ERROR: 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.',
  BOOK_NOT_FOUND: 'Không tìm thấy cuốn sách này.',
  SHELF_ENTRY_NOT_FOUND: 'Cuốn sách không còn trong tủ.',
  OPEN_LIBRARY_ERROR: 'Không lấy được dữ liệu sách. Vui lòng thử lại.',
  OPEN_LIBRARY_TIMEOUT: 'Nguồn dữ liệu sách phản hồi quá lâu. Vui lòng thử lại.',
  INTERNAL_SERVER_ERROR: 'Máy chủ gặp lỗi. Vui lòng thử lại.',
}

http.interceptors.response.use(
  response => response.data,
  error => {
    const status = error.response?.status ?? 0
    const code = error.response?.data?.error?.code ?? (status ? 'HTTP_ERROR' : 'NETWORK_ERROR')
    const message = messages[code] ?? error.response?.data?.error?.message ?? 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'
    return Promise.reject(Object.assign(new Error(message), { status, code }))
  },
)
