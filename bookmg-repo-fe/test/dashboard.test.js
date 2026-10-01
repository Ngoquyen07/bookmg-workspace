// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import DashboardPage from '../src/views/DashboardPage.vue'
import { dashboardApi } from '../src/modules/dashboard/api/dashboardApi.js'
import appRouter from '../src/router/index.js'

let wrapper
afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks() })

const emptyList = () => ({ data: [], meta: { count: 0, total: 0, limit: 4 } })
const emptyDashboard = () => ({
  stats: { total: 0, wantToRead: 0, reading: 0, finished: 0 },
  continueReading: emptyList(), nearlyFinished: emptyList(), recentlyFinished: emptyList(),
})
async function render() {
  const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
  await router.push('/')
  await router.isReady()
  wrapper = mount(DashboardPage, { global: { plugins: [router] } })
  return router
}

test('dashboard shows loading, empty guidance, an error, and a working retry', async () => {
  let reject
  const get = vi.spyOn(dashboardApi, 'get').mockImplementationOnce(() => new Promise((_, fail) => { reject = fail }))
  await render()
  expect(wrapper.get('[role="status"]').text()).toContain('Đang tải tổng quan')
  reject(new Error('Connection failed'))
  await flushPromises()
  expect(wrapper.find('[role="status"]').exists()).toBe(false)
  expect(wrapper.get('[role="alert"]').text()).toContain('Connection failed')
  get.mockResolvedValueOnce({ data: emptyDashboard() })
  await wrapper.get('[role="alert"] button').trigger('click')
  await flushPromises()
  expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  expect(wrapper.text()).toContain('Tủ sách của bạn đang chờ câu chuyện đầu tiên')
  expect(wrapper.find('a[href="/discover"]').exists()).toBe(true)
  expect(wrapper.find('header button').exists()).toBe(false)
  expect(get).toHaveBeenCalledTimes(2)
})

test('unknown pages stay readable and dashboard cards link to clean detail URLs', async () => {
  const dashboard = emptyDashboard()
  dashboard.stats = { total: 1, wantToRead: 0, reading: 1, finished: 0 }
  dashboard.continueReading = {
    data: [{
      book: { id: 'OL1W', title: 'Example book', authors: [], coverUrl: null },
      shelfEntry: { id: 1, currentPage: 0, totalPages: null, lastProgressAt: null, startedAt: null },
      progressPercent: null,
    }], meta: { count: 1, total: 1, limit: 4 },
  }
  vi.spyOn(dashboardApi, 'get').mockResolvedValue({ data: dashboard })
  await render()
  await flushPromises()
  expect(wrapper.text()).toContain('Chưa rõ số trang')
  expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
  expect(wrapper.find('a[href="/books/OL1W"]').exists()).toBe(true)
  expect(wrapper.text()).toContain('Những cuốn đang đọc đạt từ 80%')
  expect(wrapper.text()).not.toMatch(/NaN|Infinity/)
})

test('old root search links retain query and pagination after moving discovery', async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
  await router.push('/?q=Harry+Potter&field=title&page=2')
  expect(router.currentRoute.value.path).toBe('/discover')
  expect(router.currentRoute.value.query).toEqual({ q: 'Harry Potter', field: 'title', page: '2' })
})
