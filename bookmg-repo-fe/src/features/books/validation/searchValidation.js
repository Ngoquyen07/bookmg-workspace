export function validateSearch(term) {
  const q = term.trim()
  if (!q) return 'Nhập tên sách hoặc tác giả để tìm kiếm.'
  if (q.length > 200) return 'Từ khóa tìm kiếm tối đa 200 ký tự.'
  return ''
}
