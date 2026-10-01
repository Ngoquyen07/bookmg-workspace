export function validateShelfUpdate({ currentPage, totalPages, rating, notes }) {
  const errors = { currentPage: '', rating: '', notes: '' }
  if (totalPages !== null) {
    const page = Number(currentPage)
    if (currentPage === '' || currentPage === null || !Number.isInteger(page) || page < 0) {
      errors.currentPage = 'Số trang phải là số nguyên không âm.'
    } else if (page > totalPages) {
      errors.currentPage = `Số trang không được vượt quá ${totalPages}.`
    }
  }
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    errors.rating = 'Đánh giá phải là số nguyên từ 1 đến 5 sao.'
  }
  if (notes.length > 1000) errors.notes = 'Ghi chú tối đa 1000 ký tự.'
  return errors
}
