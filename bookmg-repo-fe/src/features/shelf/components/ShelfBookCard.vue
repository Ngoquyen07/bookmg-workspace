<script setup>
import { RouterLink } from 'vue-router'
import BookCover from '../../../shared/components/BookCover.vue'

defineProps({ entry: { type: Object, required: true }, busy: Boolean })
const emit = defineEmits(['remove'])
</script>

<template>
  <article class="relative grid min-w-0 grid-cols-[84px_minmax(0,1fr)] gap-4 border border-line bg-surface p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-6 sm:p-5">
    <RouterLink :to="{ name: 'book-detail', params: { workId: entry.book.id } }" class="block self-start"><BookCover :url="entry.book.coverUrl" :title="entry.book.title" /></RouterLink>
    <div class="min-w-0">
      <div class="pr-10">
        <RouterLink :to="{ name: 'book-detail', params: { workId: entry.book.id } }" class="font-display text-lg font-bold leading-tight hover:text-moss sm:text-2xl">{{ entry.book.title }}</RouterLink>
        <p class="mt-1 text-sm text-muted">{{ entry.book.authors?.length ? entry.book.authors.join(', ') : 'Chưa rõ tác giả' }}</p>
      </div>
      <div class="mt-5">
        <div class="flex justify-between gap-3 text-sm text-muted">
          <span>{{ entry.shelfEntry.currentPage }} / {{ entry.shelfEntry.totalPages ?? '?' }} trang</span>
          <span>{{ entry.progressPercent === null ? 'Chưa rõ số trang' : `${entry.progressPercent}%` }}</span>
        </div>
        <div v-if="entry.progressPercent !== null" role="progressbar" :aria-label="`Tiến độ đọc ${entry.book.title}`" :aria-valuenow="entry.progressPercent" aria-valuemin="0" aria-valuemax="100" class="mt-2 h-2 overflow-hidden rounded-full bg-progress-track">
          <div class="h-full rounded-full bg-moss" :style="{ width: `${entry.progressPercent}%` }"></div>
        </div>
      </div>
      <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span v-if="entry.shelfEntry.rating">{{ '★'.repeat(entry.shelfEntry.rating) }}{{ '☆'.repeat(5 - entry.shelfEntry.rating) }}</span>
        <span v-if="entry.shelfEntry.startedAt">Bắt đầu: {{ entry.shelfEntry.startedAt }}</span>
        <span v-if="entry.shelfEntry.finishedAt">Hoàn thành: {{ entry.shelfEntry.finishedAt }}</span>
      </div>
      <p v-if="entry.shelfEntry.notes" class="mt-3 whitespace-pre-wrap text-sm text-muted">{{ entry.shelfEntry.notes }}</p>
      <RouterLink :to="{ name: 'book-detail', params: { workId: entry.book.id } }" class="mt-5 inline-block text-sm font-semibold text-moss hover:underline">Xem chi tiết và cập nhật</RouterLink>
    </div>
    <button type="button" class="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-danger hover:underline disabled:opacity-60 sm:right-5 sm:top-5" :disabled="busy" @click="emit('remove', entry)"><span v-if="busy" class="loading-spinner" aria-hidden="true"></span>Xóa</button>
  </article>
</template>
