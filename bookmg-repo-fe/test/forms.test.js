// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import AddBookForm from '../src/modules/books/components/AddBookForm.vue'
import ShelfUpdateForm from '../src/modules/shelf/components/ShelfUpdateForm.vue'

test('the selected initial status is submitted when adding a book', async () => {
  const form = mount(AddBookForm)
  await form.find('#initial-reading-status').trigger('click')
  await form.findAll('[role="menuitemradio"]').find(option => option.text().includes('Đang đọc')).trigger('click')
  await form.find('form').trigger('submit')
  expect(form.emitted('submit')?.[0]).toEqual(['reading'])
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
