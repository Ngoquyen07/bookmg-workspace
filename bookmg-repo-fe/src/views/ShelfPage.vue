<script setup>
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import { shelfApi } from '../modules/shelf/api/shelfApi.js'
import ShelfBookCard from '../modules/shelf/components/ShelfBookCard.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import PaginationNav from '../components/PaginationNav.vue'

const toast = useToast()

const tabs = [
  { value: 'want_to_read', label: 'Muốn đọc', count: 'wantToRead' },
  { value: 'reading', label: 'Đang đọc', count: 'reading' },
  { value: 'finished', label: 'Đã đọc', count: 'finished' },
]
const status = shallowRef('want_to_read')
const pages = shallowRef({ want_to_read: 1, reading: 1, finished: 1 })
const page = computed(() => pages.value[status.value])
const entries = shallowRef([])
const meta = shallowRef({ page: 1, limit: 10, count: 0, total: 0, totalPages: 0 })
const stats = shallowRef({ total: 0, wantToRead: 0, reading: 0, finished: 0 })
const loading = shallowRef(false)
const busyId = shallowRef(null)
const removing = shallowRef(null)
const error = shallowRef('')
const results = useTemplateRef('results')
const resultsMinHeight = shallowRef(0)
let requestId = 0

function changeStatus(next) {
  if (status.value === next) return
  resultsMinHeight.value = Math.max(0, window.innerHeight - results.value.getBoundingClientRect().top)
  status.value = next
}

function changePage(next) {
  if (next < 1 || next > meta.value.totalPages || next === page.value) return
  window.scrollTo({ top: 0, behavior: 'instant' })
  resultsMinHeight.value = 0
  pages.value = { ...pages.value, [status.value]: next }
}

async function load() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const [list, counts] = await Promise.all([shelfApi.list({ status: status.value, page: page.value }), shelfApi.stats()])
    if (id === requestId) {
      entries.value = list.data
      meta.value = list.meta
      stats.value = counts.data
      if (page.value > 1 && page.value > list.meta.totalPages) {
        pages.value = { ...pages.value, [status.value]: Math.max(1, list.meta.totalPages) }
      }
    }
  } catch (cause) {
    if (id === requestId) error.value = cause.message
  } finally {
    if (id === requestId) loading.value = false
  }
}
watch(() => [status.value, page.value], load, { immediate: true })

async function remove() {
  if (!removing.value) return
  const bookId = removing.value.book.id
  busyId.value = bookId
  error.value = ''
  try {
    await shelfApi.remove(bookId)
    removing.value = null
    toast.success('Đã xóa sách khỏi tủ.')
    await load()
  } catch (cause) { toast.error(`Không thể xóa sách: ${cause.message}`) }
  finally { busyId.value = null }
}
</script>

<template>
  <main class="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
    <section class="py-10 sm:py-14">
      <div class="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 class="font-display text-4xl font-bold tracking-tight sm:text-6xl">Tủ sách của tôi</h1>
          <p class="mt-3 text-muted">Mọi cuốn sách và chặng đường đọc của bạn ở một nơi.</p>
        </div>
        <RouterLink to="/" class="rounded-lg bg-[#146b5b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0d5146]">+ Tìm sách mới</RouterLink>
      </div>
      <div class="mt-9 grid grid-cols-3 border-y border-line bg-surface">
        <div class="px-4 py-5 sm:px-8"><p class="text-xs text-muted sm:text-sm">Tổng số sách</p><p class="mt-1 font-display text-3xl font-bold sm:text-5xl">{{ stats.total }}</p></div>
        <div class="border-x border-line px-4 py-5 sm:px-8"><p class="text-xs text-muted sm:text-sm">Đang đọc</p><p class="mt-1 font-display text-3xl font-bold text-moss sm:text-5xl">{{ stats.reading }}</p></div>
        <div class="px-4 py-5 sm:px-8"><p class="text-xs text-muted sm:text-sm">Đã đọc</p><p class="mt-1 font-display text-3xl font-bold sm:text-5xl">{{ stats.finished }}</p></div>
      </div>
    </section>

    <div class="flex justify-between gap-1 border-b border-line sm:justify-start sm:gap-2" role="tablist" aria-label="Lọc tủ sách theo trạng thái">
      <button v-for="tab in tabs" :key="tab.value" type="button" role="tab" :aria-selected="status === tab.value" class="shrink-0 border-b-2 px-1 py-3 text-xs font-semibold sm:px-4 sm:text-sm" :class="status === tab.value ? 'border-moss text-moss' : 'border-transparent text-muted hover:text-ink'" @click="changeStatus(tab.value)">{{ tab.label }} ({{ stats[tab.count] }})</button>
    </div>
    <div ref="results" :style="{ minHeight: `${resultsMinHeight}px` }">
      <div v-if="error" role="alert" class="mt-5 rounded-lg border border-line bg-danger-surface p-5 text-danger">{{ error }} <button type="button" class="ml-2 font-semibold underline" @click="load">Thử lại</button></div>
      <div v-if="loading" role="status" class="screen-loading text-muted"><span class="loading-spinner loading-spinner-lg" aria-hidden="true"></span>Đang tải tủ sách...</div>
      <div v-else-if="!error && entries.length === 0" class="py-16 text-center">
        <p class="font-display text-2xl font-bold">Chưa có sách ở mục này</p>
        <p class="mt-2 text-muted">Tìm một cuốn sách để bắt đầu tủ sách của bạn.</p>
        <RouterLink to="/" class="mt-5 inline-block rounded-lg bg-moss px-5 py-2.5 font-semibold text-white">Tìm sách</RouterLink>
      </div>
      <div v-else-if="!error" class="mt-7 grid gap-5 lg:grid-cols-2">
        <ShelfBookCard v-for="entry in entries" :key="entry.shelfEntry.id" :entry="entry" :busy="busyId === entry.book.id" @remove="removing = $event" />
      </div>
      <p v-if="!loading && !error && meta.total" class="mt-6 text-center text-sm text-muted">{{ (meta.page - 1) * meta.limit + 1 }}–{{ (meta.page - 1) * meta.limit + meta.count }} / {{ meta.total }} sách</p>
      <PaginationNav v-if="!loading && !error" :page="meta.page" :total-pages="meta.totalPages" @change="changePage" />
    </div>
    <ConfirmDialog :open="Boolean(removing)" :title="removing?.book.title ?? ''" :busy="Boolean(busyId)" @close="removing = null" @confirm="remove" />
  </main>
</template>
