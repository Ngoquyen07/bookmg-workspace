// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import AddBookForm from '../src/modules/books/components/AddBookForm.vue'
import ShelfUpdateForm from '../src/modules/shelf/components/ShelfUpdateForm.vue'

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
