<script setup>
import { computed } from 'vue'

const props = defineProps({ page: { type: Number, required: true }, totalPages: { type: Number, required: true } })
const emit = defineEmits(['change'])
const pages = computed(() => {
  const start = Math.max(1, Math.min(props.page - 2, props.totalPages - 4))
  return Array.from({ length: Math.min(5, props.totalPages) }, (_, index) => start + index)
})
</script>

<template>
  <nav v-if="totalPages > 1" aria-label="Phân trang kết quả" class="flex flex-wrap items-center justify-center gap-2 py-7">
    <button type="button" class="rounded-lg border border-line px-3 py-2 disabled:opacity-40" :disabled="page <= 1" @click="emit('change', page - 1)">Trước</button>
    <button v-for="number in pages" :key="number" type="button" class="min-w-10 rounded-lg border px-3 py-2" :class="number === page ? 'border-moss bg-moss text-white' : 'border-line bg-surface hover:border-moss'" :aria-current="number === page ? 'page' : undefined" @click="emit('change', number)">{{ number }}</button>
    <button type="button" class="rounded-lg border border-line px-3 py-2 disabled:opacity-40" :disabled="page >= totalPages || page >= 10000" @click="emit('change', page + 1)">Sau</button>
  </nav>
</template>
