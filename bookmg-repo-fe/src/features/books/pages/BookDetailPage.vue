<script setup>
import { computed, shallowRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { booksApi } from '../api/booksApi.js'
import { shelfApi } from '../../shelf/api/shelfApi.js'
import BookCover from '../../../shared/components/BookCover.vue'
import AddBookForm from '../components/AddBookForm.vue'
import ShelfUpdateForm from '../../shelf/components/ShelfUpdateForm.vue'
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const previousPath = window.history.state?.back
const backTo = previousPath === '/' || previousPath?.startsWith('/?') || previousPath?.startsWith('/shelf') ? previousPath : '/'
const backToShelf = backTo.startsWith('/shelf')
if (Object.keys(route.query).length) router.replace({ name: 'book-detail', params: { workId: route.params.workId } })
const toast = useToast()
const book = shallowRef(null)
const loading = shallowRef(false)
const adding = shallowRef(false)
const saving = shallowRef(false)
const deleting = shallowRef(false)
const confirmingDelete = shallowRef(false)
const shelfLoading = shallowRef(false)
const shelfEntry = shallowRef(null)
const error = shallowRef('')
const showAllSubjects = shallowRef(false)
const visibleSubjects = computed(() => showAllSubjects.value ? book.value?.subjects ?? [] : book.value?.subjects?.slice(0, 12) ?? [])

let requestId = 0
async function loadShelfEntry(workId) {
  shelfLoading.value = true
  try {
    const result = await shelfApi.get(workId)
    if (route.params.workId === workId) shelfEntry.value = result.data
  } catch (cause) {
    if (route.params.workId === workId) error.value = `Không tải được tiến độ đọc: ${cause.message}`
  } finally {
    if (route.params.workId === workId) shelfLoading.value = false
  }
}

async function loadDetail() {
  const id = ++requestId
  book.value = null
  shelfEntry.value = null
  confirmingDelete.value = false
  error.value = ''
  showAllSubjects.value = false
  loading.value = true
  try {
    const result = await booksApi.detail(route.params.workId)
    if (id === requestId) {
      book.value = result.data
      if (result.data.isInShelf) await loadShelfEntry(result.data.id)
    }
  } catch (cause) {
    if (id === requestId) error.value = cause.message
  } finally {
    if (id === requestId) loading.value = false
  }
}
watch(() => route.params.workId, loadDetail, { immediate: true })

async function add() {
  if (!book.value) return
  adding.value = true
  error.value = ''
  try {
    await shelfApi.add({ workId: book.value.id, ...(book.value.editionId ? { editionId: book.value.editionId } : {}) })
    book.value = { ...book.value, isInShelf: true }
    toast.success('Đã thêm sách vào tủ.')
    await loadShelfEntry(book.value.id)
  } catch (cause) {
    if (cause.code === 'BOOK_ALREADY_IN_SHELF') {
      book.value = { ...book.value, isInShelf: true }
      toast.info('Sách đã có trong tủ.')
      await loadShelfEntry(book.value.id)
    } else toast.error(`Không thể thêm sách: ${cause.message}`)
  } finally {
    adding.value = false
  }
}

async function save(payload) {
  if (!book.value) return
  saving.value = true
  error.value = ''
  try {
    await shelfApi.update(book.value.id, payload)
    toast.success('Đã lưu thay đổi.')
    await loadShelfEntry(book.value.id)
  } catch (cause) { toast.error(`Không thể lưu thay đổi: ${cause.message}`) }
  finally { saving.value = false }
}

async function remove() {
  if (!confirmingDelete.value || !book.value?.isInShelf || deleting.value) return
  deleting.value = true
  try {
    await shelfApi.remove(book.value.id)
    confirmingDelete.value = false
    toast.success('Đã xóa sách khỏi tủ.')
  } catch (cause) {
    toast.error(`Không thể xóa sách: ${cause.message}`)
    return
  } finally {
    deleting.value = false
  }
  router.push(backTo)
}
</script>

<template>
  <main class="mx-auto max-w-7xl px-5 py-9 sm:px-8">
    <RouterLink :to="backTo" class="text-sm font-semibold text-moss hover:underline">{{ backToShelf ? '← Quay lại tủ sách' : '← Quay lại tìm kiếm' }}</RouterLink>
    <div v-if="loading" role="status" class="screen-loading text-muted"><span class="loading-spinner loading-spinner-lg" aria-hidden="true"></span>Đang tải chi tiết sách...</div>
    <div v-else-if="book" class="mt-8 grid gap-10 lg:grid-cols-[minmax(280px,390px)_minmax(0,1fr)] lg:gap-14">
      <div class="flex max-h-[380px] self-start items-center justify-center bg-cover-stage px-8 py-8"><BookCover :url="book.coverUrl" :title="book.title" class="w-full max-w-52" /></div>
      <div class="py-1 lg:py-8">
        <p class="text-sm font-semibold text-moss">Chi tiết sách</p>
        <h1 class="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">{{ book.title }}</h1>
        <p class="mt-4 text-lg text-muted">{{ book.authors?.length ? book.authors.join(', ') : 'Chưa rõ tác giả' }}</p>
        <div class="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-y border-line py-5 text-sm text-muted">
          <p><span class="block text-xs">Xuất bản lần đầu</span><span class="mt-1 block font-semibold text-ink">{{ book.firstPublishYear ?? 'Chưa rõ' }}</span></p>
          <p><span class="block text-xs">Số trang</span><span class="mt-1 block font-semibold text-ink">{{ book.totalPages ? `${book.totalPages} trang` : 'Chưa rõ' }}</span></p>
        </div>
        <div class="mt-6 border-b border-line pb-7">
          <div v-if="book.isInShelf" class="flex flex-wrap items-center justify-between gap-3">
            <p class="font-semibold text-moss">✓ Đã có trong tủ sách</p>
            <button type="button" class="text-sm font-semibold text-danger hover:underline disabled:opacity-60" :disabled="saving || deleting" @click="confirmingDelete = true">Xóa khỏi tủ sách</button>
          </div>
          <AddBookForm v-else :busy="adding" @submit="add" />
        </div>
        <div v-if="shelfLoading" role="status" class="screen-loading text-muted"><span class="loading-spinner loading-spinner-lg" aria-hidden="true"></span>Đang tải tiến độ đọc...</div>
        <ShelfUpdateForm v-else-if="shelfEntry" :entry="shelfEntry" :busy="saving" @save="save" />
        <section class="mt-9">
          <h2 class="font-display text-2xl font-bold">Giới thiệu</h2>
          <p class="mt-3 whitespace-pre-line leading-7 text-muted">{{ book.description || 'Sách này chưa có mô tả.' }}</p>
        </section>
        <section class="mt-8" v-if="book.subjects?.length">
          <h2 class="font-display text-2xl font-bold">Chủ đề</h2>
          <div class="mt-4 flex flex-wrap gap-2"><span v-for="subject in visibleSubjects" :key="subject" class="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">{{ subject }}</span></div>
          <button v-if="book.subjects.length > 12" type="button" class="mt-4 text-sm font-semibold text-moss hover:underline" @click="showAllSubjects = !showAllSubjects">{{ showAllSubjects ? 'Thu gọn' : `Xem thêm ${book.subjects.length - 12} chủ đề` }}</button>
        </section>
      </div>
    </div>
    <div v-if="error" role="alert" class="mt-7 rounded-lg border border-line bg-danger-surface p-5 text-danger">{{ error }} <button type="button" class="ml-2 font-semibold underline" @click="loadDetail">Thử lại</button></div>
    <ConfirmDialog :open="confirmingDelete" :title="book?.title ?? ''" :busy="deleting" @close="confirmingDelete = false" @confirm="remove" />
  </main>
</template>
