<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BookCover from '../../../components/BookCover.vue'
import { DASHBOARD_MESSAGES as messages } from '../../../config/messageConfig.js'

const props = defineProps({ entry: { type: Object, required: true }, kind: { type: String, required: true } })
const completed = computed(() => props.kind === 'recentlyFinished')
const remaining = computed(() => props.entry.shelfEntry.totalPages === null ? null : Math.max(0, props.entry.shelfEntry.totalPages - props.entry.shelfEntry.currentPage))
const activity = computed(() => props.entry.shelfEntry.lastProgressAt ?? props.entry.shelfEntry.startedAt)
function formatDate(value) {
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}
</script>

<template>
  <article class="flex min-w-0 gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-moss sm:gap-5 sm:p-5">
    <RouterLink :to="{ name: 'book-detail', params: { workId: entry.book.id } }" class="w-16 shrink-0 self-start sm:w-20" :aria-label="entry.book.title">
      <BookCover :url="entry.book.coverUrl" :title="entry.book.title" compact />
    </RouterLink>
    <div class="flex min-w-0 flex-1 flex-col">
      <RouterLink :to="{ name: 'book-detail', params: { workId: entry.book.id } }" class="line-clamp-2 font-display text-xl font-bold leading-snug text-ink hover:text-moss">{{ entry.book.title }}</RouterLink>
      <p class="mt-1 line-clamp-1 text-sm text-muted">{{ entry.book.authors.length ? entry.book.authors.join(', ') : messages.unknownAuthor }}</p>
      <template v-if="!completed">
        <div class="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted">
          <span>{{ entry.shelfEntry.currentPage }} / {{ entry.shelfEntry.totalPages ?? '?' }} {{ messages.pagesUnit }}</span>
          <span v-if="entry.progressPercent !== null" class="font-semibold text-moss">{{ entry.progressPercent }}%</span>
        </div>
        <div v-if="entry.progressPercent !== null" role="progressbar" :aria-label="`${messages.openDetail}: ${entry.book.title}`" :aria-valuenow="entry.progressPercent" aria-valuemin="0" aria-valuemax="100" class="mt-2 h-1.5 overflow-hidden rounded-full bg-progress-track">
          <div class="h-full rounded-full bg-moss" :style="{ width: `${entry.progressPercent}%` }"></div>
        </div>
        <p class="mt-2 text-xs text-muted">{{ remaining === null ? messages.unknownPages : `${messages.remainingPrefix} ${remaining} ${messages.pagesUnit}` }}</p>
        <p v-if="activity" class="mt-2 text-xs text-muted">{{ entry.shelfEntry.lastProgressAt ? messages.progressDate : messages.startDate }}: {{ formatDate(activity) }}</p>
      </template>
      <template v-else>
        <p class="mt-4 text-sm text-muted">{{ entry.shelfEntry.finishedAt ? `${messages.completionDate}: ${formatDate(entry.shelfEntry.finishedAt)}` : messages.noCompletionDate }}</p>
        <p v-if="entry.shelfEntry.rating" class="mt-2 text-moss" :aria-label="`${entry.shelfEntry.rating}/5`">{{ '★'.repeat(entry.shelfEntry.rating) }}{{ '☆'.repeat(5 - entry.shelfEntry.rating) }}</p>
      </template>
      <RouterLink :to="{ name: 'book-detail', params: { workId: entry.book.id } }" class="mt-4 inline-flex items-center gap-2 self-start text-sm font-semibold text-moss hover:underline">
        {{ completed ? messages.finishedDetail : messages.openDetail }}
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
      </RouterLink>
    </div>
  </article>
</template>
