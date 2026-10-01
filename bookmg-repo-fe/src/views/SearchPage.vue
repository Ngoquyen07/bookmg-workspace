<script setup>
import { computed, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { booksApi } from '../modules/books/api/booksApi.js'
import { shelfApi } from '../modules/shelf/api/shelfApi.js'
import SearchForm from '../modules/books/components/SearchForm.vue'
import BookCard from '../modules/books/components/BookCard.vue'
import PaginationNav from '../components/PaginationNav.vue'
import { validateSearch } from '../modules/books/validation/searchValidation.js'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const books = shallowRef([])
const meta = shallowRef({ page: 1, count: 0, total: 0, totalPages: 0 })
const loading = shallowRef(false)
const searching = shallowRef(false)
const addingId = shallowRef(null)
const error = shallowRef('')
const query = computed(() => typeof route.query.q === 'string' ? route.query.q : '')
const field = computed(() => ['all', 'title', 'author', 'subject'].includes(route.query.field) ? route.query.field : 'all')
const page = computed(() => {
  const value = Number(route.query.page ?? 1)
  return Number.isInteger(value) && value >= 1 && value <= 10000 ? value : 1
})

let requestId = 0
async function loadSearch() {
  const id = ++requestId
  books.value = []
  error.value = validateSearch(query.value)
  if (!query.value) {
    error.value = ''
    meta.value = { page: 1, count: 0, total: 0, totalPages: 0 }
    loading.value = false
    searching.value = false
    return
  }
  if (error.value) { loading.value = false; searching.value = false; return }
  loading.value = true
  try {
    const result = await booksApi.search({ q: query.value.trim(), field: field.value, page: page.value, limit: 20 })
    if (id === requestId) { books.value = result.data; meta.value = result.meta; error.value = '' }
  } catch (cause) {
    if (id === requestId) error.value = cause.message
  } finally {
    if (id === requestId) { loading.value = false; searching.value = false }
  }
}
watch(() => [query.value, field.value, page.value], loadSearch, { immediate: true })

function search({ q, field: selectedField }) {
  searching.value = true
  if (query.value === q && field.value === selectedField && page.value === 1) {
    loadSearch()
    return
  }
  router.push({ name: 'search', query: { q, field: selectedField, page: 1 } })
}

function changePage(next) {
  if (next < 1 || next > Math.min(meta.value.totalPages, 10000)) return
  router.push({ name: 'search', query: { q: query.value, field: field.value, page: next } })
}

async function addBook(workId) {
  addingId.value = workId
  try {
    const detail = await booksApi.detail(workId)
    await shelfApi.add({ workId, ...(detail.data.editionId ? { editionId: detail.data.editionId } : {}) })
    books.value = books.value.map(book => book.id === workId ? { ...book, isInShelf: true } : book)
    toast.success('Đã thêm sách vào tủ.')
  } catch (cause) {
    if (cause.code === 'BOOK_ALREADY_IN_SHELF') {
      books.value = books.value.map(book => book.id === workId ? { ...book, isInShelf: true } : book)
      toast.info('Sách đã có trong tủ.')
    } else toast.error(`Không thể thêm sách: ${cause.message}`)
  } finally {
    addingId.value = null
  }
}
</script>

<template>
  <main class="pb-16">
    <section class="bg-[#162c29] text-white">
      <div class="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
        <div class="relative z-10 max-w-2xl">
          <h1 class="font-display text-4xl leading-[1.08] tracking-tight sm:text-6xl">Tìm câu chuyện tiếp theo của bạn.</h1>
          <p class="mt-4 max-w-lg text-base leading-7 text-[#c3d7cf]">Tìm sách theo tên, tác giả hoặc chủ đề, rồi lưu những cuốn bạn muốn đọc vào tủ sách của mình.</p>
          <div class="mt-8"><SearchForm :initial-query="query" :initial-field="field" :busy="searching" @search="search" /></div>
        </div>
        <div aria-hidden="true" class="relative hidden h-64 items-end justify-center gap-2 border-b-8 border-[#9db3a4] lg:flex">
          <div class="shelf-spine h-45 w-12 -rotate-9 rounded-t-sm bg-[#b98359]"></div>
          <div class="shelf-spine h-56 w-14 rounded-t-sm bg-[#d8d2bb]"></div>
          <div class="shelf-spine h-48 w-11 rotate-3 rounded-t-sm bg-[#49766b]"></div>
          <div class="shelf-spine h-62 w-16 rounded-t-sm bg-[#a76555]"></div>
          <div class="shelf-spine h-52 w-12 -rotate-4 rounded-t-sm bg-[#7c8c9b]"></div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-5 pt-10 sm:px-8" aria-label="Kết quả tìm kiếm">
      <div v-if="query && !loading && !error" class="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-5">
        <h2 class="font-display text-3xl font-bold">Kết quả cho “{{ query }}”</h2>
        <p class="text-sm font-medium text-muted">{{ meta.total.toLocaleString('vi-VN') }} cuốn sách</p>
      </div>
      <div v-if="loading" role="status" class="screen-loading text-muted"><span class="loading-spinner loading-spinner-lg" aria-hidden="true"></span>Đang tìm sách...</div>
      <div v-else-if="error" role="alert" class="mt-7 rounded-lg border border-line bg-danger-surface p-6 text-danger">
        <p>{{ error }}</p><button v-if="query" type="button" class="mt-3 font-semibold underline" @click="loadSearch">Thử lại</button>
      </div>
      <div v-else-if="!query" class="py-16 text-center text-muted">Nhập tên sách, tác giả hoặc chủ đề để bắt đầu khám phá.</div>
      <div v-else-if="books.length === 0" class="py-16 text-center text-muted">Không tìm thấy sách phù hợp. Thử một từ khóa khác.</div>
      <div v-else class="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
        <BookCard v-for="book in books" :key="book.id" :book="book" :busy="addingId === book.id" @add="addBook" />
      </div>
      <PaginationNav v-if="!loading && !error && books.length" :page="meta.page" :total-pages="Math.min(meta.totalPages, 10000)" @change="changePage" />
    </section>
  </main>
</template>
