<script setup>
import { onUnmounted, shallowRef, watch } from 'vue'
import DropdownSelect from '../../../components/DropdownSelect.vue'
import { validateSearch } from '../validation/searchValidation.js'

const props = defineProps({ initialQuery: { type: String, default: '' }, initialField: { type: String, default: 'all' }, busy: Boolean })
const emit = defineEmits(['search'])
const options = [
  { value: 'all', label: 'Tất cả' },
  { value: 'title', label: 'Tên sách' },
  { value: 'author', label: 'Tác giả' },
  { value: 'subject', label: 'Chủ đề' },
]
const query = shallowRef(props.initialQuery)
const field = shallowRef(props.initialField)
const error = shallowRef('')
let errorTimer

watch(() => props.initialQuery, value => { query.value = value })
watch(() => props.initialField, value => { field.value = value })
onUnmounted(() => clearTimeout(errorTimer))

function submit() {
  clearTimeout(errorTimer)
  error.value = validateSearch(query.value)
  if (error.value) {
    errorTimer = setTimeout(() => { error.value = '' }, 3000)
    return
  }
  emit('search', { q: query.value.trim(), field: field.value })
}
</script>

<template>
  <div class="relative">
    <form class="search-panel rounded-xl border-2 border-transparent bg-surface p-1.5 text-ink shadow-[0_16px_40px_rgba(3,25,20,.2)] focus-within:border-[#75d0ac]" @submit.prevent="submit">
      <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div class="min-w-0">
          <div class="flex min-h-12 items-center gap-3 px-3">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5 shrink-0 text-muted"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
            <label for="book-query" class="sr-only">Tên sách, tác giả hoặc chủ đề</label>
            <input id="book-query" v-model="query" type="search" maxlength="200" placeholder="Tìm tên sách, tác giả hoặc chủ đề..." class="w-full min-w-0 bg-transparent text-ink placeholder:text-muted/80" :aria-invalid="Boolean(error)" :aria-describedby="error ? 'search-error' : undefined" @input="error = ''" />
          </div>
          <p v-if="error" id="search-error" role="alert" class="px-3 pb-1 pt-1 text-sm font-medium text-danger">{{ error }}</p>
        </div>
        <DropdownSelect id="search-field" v-model="field" label="Tìm theo" :options="options" />
        <button type="submit" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#146b5b] px-6 font-semibold text-white hover:bg-[#0d5146] disabled:opacity-60" :disabled="busy"><span v-if="busy" class="loading-spinner" aria-hidden="true"></span>Tìm sách</button>
      </div>
    </form>
  </div>
</template>
