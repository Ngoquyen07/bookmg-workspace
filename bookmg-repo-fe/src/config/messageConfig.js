export const API_ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.',
  BOOK_NOT_FOUND: 'Không tìm thấy cuốn sách này.',
  SHELF_ENTRY_NOT_FOUND: 'Cuốn sách không còn trong tủ.',
  OPEN_LIBRARY_ERROR: 'Không lấy được dữ liệu sách. Vui lòng thử lại.',
  OPEN_LIBRARY_TIMEOUT: 'Nguồn dữ liệu sách phản hồi quá lâu. Vui lòng thử lại.',
  INTERNAL_SERVER_ERROR: 'Máy chủ gặp lỗi. Vui lòng thử lại.',
}

export const DEFAULT_API_ERROR_MESSAGE = 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'

export const DASHBOARD_MESSAGES = {
  title: 'Hành trình của bạn',
  description: 'Tiếp nối những trang đang đọc và nhìn lại những cuốn đã hoàn thành.',
  loading: 'Đang tải tổng quan...',
  discover: 'Tìm sách mới',
  retry: 'Thử lại',
  error: 'Không tải được tổng quan.',
  emptyTitle: 'Tủ sách của bạn đang chờ câu chuyện đầu tiên',
  emptyDescription: 'Khám phá một cuốn sách và thêm vào tủ để bắt đầu theo dõi chặng đọc.',
  openShelf: 'Mở tủ sách',
  openDetail: 'Tiếp tục đọc',
  finishedDetail: 'Xem lại cuốn sách',
  unknownAuthor: 'Chưa rõ tác giả',
  unknownPages: 'Chưa rõ số trang',
  noCompletionDate: 'Chưa có ngày hoàn thành',
  completionDate: 'Hoàn thành',
  progressDate: 'Cập nhật tiến độ',
  startDate: 'Bắt đầu đọc',
  booksUnit: 'cuốn',
  pagesUnit: 'trang',
  remainingPrefix: 'Còn',
}

export const DASHBOARD_STATS = [
  { key: 'total', label: 'Tổng số sách' },
  { key: 'wantToRead', label: 'Muốn đọc' },
  { key: 'reading', label: 'Đang đọc' },
  { key: 'finished', label: 'Đã đọc' },
]

export const DASHBOARD_SECTIONS = {
  continueReading: {
    title: 'Tiếp tục đọc',
    description: 'Những cuốn đang đọc, ưu tiên lần cập nhật tiến độ gần nhất.',
    empty: 'Chọn một cuốn trong tủ và chuyển sang Đang đọc để tiếp tục tại đây.',
    status: 'reading',
  },
  nearlyFinished: {
    title: 'Sắp đọc xong',
    description: 'Bạn đã đi qua ít nhất 80% chặng đường của những cuốn này.',
    empty: 'Những cuốn đang đọc đạt từ 80% và có số trang xác định sẽ xuất hiện ở đây.',
    status: 'reading',
  },
  recentlyFinished: {
    title: 'Vừa hoàn thành',
    description: 'Những câu chuyện vừa khép lại trong tủ sách của bạn.',
    empty: 'Khi hoàn thành một cuốn sách, bạn sẽ nhìn lại nó tại đây.',
    status: 'finished',
  },
}
