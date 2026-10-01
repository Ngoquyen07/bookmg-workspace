<script setup>
import { RouterLink } from 'vue-router'
import BookCover from '../../../shared/components/BookCover.vue'

defineProps({ book: { type: Object, required: true }, busy: Boolean })
const emit = defineEmits(['add'])
</script>

<template>
  <article class="group flex min-w-0 flex-col">
    <RouterLink :to="{ name: 'book-detail', params: { workId: book.id } }" class="block bg-cover-stage px-6 py-7 sm:px-7 sm:py-8">
      <BookCover :url="book.coverUrl" :title="book.title" class="mx-auto max-w-40 transition-transform duration-200 group-hover:-translate-y-1" />
    </RouterLink>
    <div class="flex flex-1 flex-col pt-4">
      <p class="text-xs font-semibold text-moss">{{ book.firstPublishYear ?? 'Chưa rõ năm xuất bản' }}</p>
      <RouterLink :to="{ name: 'book-detail', params: { workId: book.id } }" class="mt-1 line-clamp-2 font-display text-xl font-bold leading-snug hover:text-moss">{{ book.title }}</RouterLink>
      <p class="mt-1 line-clamp-1 text-sm text-muted">{{ book.authors?.length ? book.authors.join(', ') : 'Chưa rõ tác giả' }}</p>
      <span v-if="book.isInShelf" class="mt-auto pt-4 text-sm font-semibold text-moss">✓ Đã có trong tủ</span>
      <button v-else type="button" class="mt-auto inline-flex items-center gap-2 self-start pt-4 text-sm font-semibold text-moss hover:underline disabled:opacity-50" :disabled="busy" @click="emit('add', book.id)"><span v-if="busy" class="loading-spinner" aria-hidden="true"></span>{{ busy ? 'Đang thêm...' : '+ Thêm vào tủ' }}</button>
    </div>
  </article>
</template>
