// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import BookDetailPage from '../src/views/BookDetailPage.vue'
import SearchPage from '../src/views/SearchPage.vue'
import { booksApi } from '../src/modules/books/api/booksApi.js'
vi.mock('vue-toastification', () => ({ useToast: () => ({}) }))
import AddBookForm from '../src/modules/books/components/AddBookForm.vue'
import ShelfUpdateForm from '../src/modules/shelf/components/ShelfUpdateForm.vue'

test.each([
  { field: 'subject', q: 'Juvenile fiction', label: 'Chủ đề', encoded: 'Juvenile+fiction' },
  { field: 'author', q: 'J. K. Rowling', label: 'Tác giả', encoded: 'J.+K.+Rowling' },
])('detail $field opens discovery and pagination retains its mode', async ({ field, q, label, encoded }) => {
  const detail = vi.spyOn(booksApi, 'detail').mockResolvedValue({ data: {
    id: 'OL1W', title: 'Example', subjects: ['Juvenile fiction'], authors: ['J. K. Rowling', 'Another Author'], isInShelf: false,
  } })
  const search = vi.spyOn(booksApi, 'search').mockImplementation(async params => ({
    data: [{ id: 'OL1W', title: 'Example', authors: [], coverUrl: null, isInShelf: false }],
    meta: { page: params.page, total: 21, count: 1, totalPages: 2 },
  }))
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/books/:workId', name: 'book-detail', component: BookDetailPage },
    { path: '/discover', name: 'search', component: SearchPage },
  ] })
  await router.push('/books/OL1W')
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  try {
    await flushPromises()
    expect(wrapper.findAll('a').some(item => item.text() === 'Another Author')).toBe(true)
    const link = wrapper.findAll('a').find(item => item.text() === q)
    expect(link.attributes('href')).toBe(`/discover?q=${encoded}&field=${field}&page=1`)
    await link.trigger('click')
    await flushPromises()
    expect(search).toHaveBeenLastCalledWith({ q, field, page: 1, limit: 20 })
    expect(wrapper.get('#search-field').text()).toBe(label)
    await wrapper.findAll('nav[aria-label="Phân trang kết quả"] button').find(item => item.text() === 'Sau').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ q, field, page: '2' })
    expect(search).toHaveBeenLastCalledWith({ q, field, page: 2, limit: 20 })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(search).toHaveBeenLastCalledWith({ q, field, page: 1, limit: 20 })
    expect(detail).toHaveBeenCalledTimes(1)
  } finally { wrapper.unmount(); vi.restoreAllMocks() }
})

test('a book outside the shelf has no status selector before adding', async () => {
  const form = mount(AddBookForm)
  expect(form.find('#initial-reading-status').exists()).toBe(false)
  await form.find('form').trigger('submit')
  expect(form.emitted('submit')?.[0]).toEqual([])
})

test('clicking the selected star clears a saved rating', async () => {
  const form = mount(ShelfUpdateForm, {
    props: {
      entry: {
        book: { title: 'Example' },
        shelfEntry: { currentPage: 10, totalPages: 100, status: 'reading', rating: 3, notes: null },
        progressPercent: 10,
      },
    },
  })
  await form.find('button[aria-label="Bỏ đánh giá"]').trigger('click')
  await form.find('form').trigger('submit')
  expect(form.emitted('save')?.[0][0].rating).toBeNull()
})
