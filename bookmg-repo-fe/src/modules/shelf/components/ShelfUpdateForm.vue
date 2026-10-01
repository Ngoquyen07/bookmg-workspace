<script setup>
import { computed, shallowRef, watch } from 'vue'
import { validateShelfUpdate } from '../validation/shelfValidation.js'
import DropdownSelect from '../../../components/DropdownSelect.vue'

const props = defineProps({ entry: { type: Object, required: true }, busy: Boolean })
const emit = defineEmits(['save'])
const currentPage = shallowRef(0)
const status = shallowRef('want_to_read')
const rating = shallowRef(null)
const notes = shallowRef('')
const errors = shallowRef({ currentPage: '', rating: '', notes: '' })
const statusOptions = [
  { value: 'want_to_read', label: 'Muốn đọc' },
  { value: 'reading', label: 'Đang đọc' },
  { value: 'finished', label: 'Đã đọc' },
]

const changed = computed(() => {
  const original = props.entry.shelfEntry
  return (original.totalPages !== null && (currentPage.value === '' || Number(currentPage.value) !== original.currentPage))
    || status.value !== original.status
    || rating.value !== original.rating
    || notes.value !== (original.notes ?? '')
})
const hasErrors = computed(() => Object.values(errors.value).some(Boolean))

function reset() {
  const value = props.entry.shelfEntry
  currentPage.value = value.currentPage
  status.value = value.status
  rating.value = value.rating
  notes.value = value.notes ?? ''
  errors.value = { currentPage: '', rating: '', notes: '' }
}

watch(() => props.entry.shelfEntry, reset, { immediate: true })

function validate() {
  errors.value = validateShelfUpdate({
    currentPage: currentPage.value,
    totalPages: props.entry.shelfEntry.totalPages,
    rating: rating.value,
    notes: notes.value,
  })
  return !hasErrors.value
}

function onPageInput() {
  validate()
  if (errors.value.currentPage) return
  const page = Number(currentPage.value)
  if (page === props.entry.shelfEntry.totalPages) status.value = 'finished'
  else if (page > 0 || status.value === 'finished') status.value = 'reading'
}

function selectStatus(value) {
  status.value = value
  if (value === 'want_to_read' && Number(currentPage.value) > 0) currentPage.value = 0
  if (value === 'finished' && props.entry.shelfEntry.totalPages !== null) {
    currentPage.value = props.entry.shelfEntry.totalPages
  }
  validate()
}

function save() {
  if (props.busy || !changed.value) return
  const totalPages = props.entry.shelfEntry.totalPages
  if (!validate()) return
  emit('save', {
    ...(totalPages === null ? {} : { currentPage: status.value === 'finished' ? totalPages : Number(currentPage.value) }),
    status: status.value, rating: rating.value, notes: notes.value,
  })
}
</script>

<template>
  <section class="mt-7 border-t border-line pt-7">
    <h2 class="font-display text-2xl font-bold">Tiến độ và đánh giá</h2>
    <p class="mt-2 text-sm text-muted">{{ entry.shelfEntry.currentPage }} / {{ entry.shelfEntry.totalPages ?? '?' }} trang · {{ entry.progressPercent === null ? 'Chưa rõ số trang' : `${entry.progressPercent}%` }}</p>
    <div v-if="entry.progressPercent !== null" role="progressbar" :aria-label="`Tiến độ đọc ${entry.book.title}`" :aria-valuenow="entry.progressPercent" aria-valuemin="0" aria-valuemax="100" class="mt-3 h-2 overflow-hidden rounded-full bg-progress-track">
      <div class="h-full rounded-full bg-moss" :style="{ width: `${entry.progressPercent}%` }"></div>
    </div>
    <form class="mt-6 grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="save">
      <div class="text-sm font-semibold">
        <label for="reading-status">Trạng thái</label>
        <DropdownSelect id="reading-status" :model-value="status" label="Trạng thái" :options="statusOptions" class="mt-1 font-normal" @update:model-value="selectStatus" />
      </div>
      <div class="text-sm font-semibold">
        <label for="reading-page">Trang đang đọc</label>
        <input id="reading-page" v-model="currentPage" type="number" inputmode="numeric" min="0" :max="entry.shelfEntry.totalPages ?? undefined" step="1" :disabled="entry.shelfEntry.totalPages === null" :aria-invalid="!!errors.currentPage" :aria-describedby="errors.currentPage ? 'reading-page-error' : undefined" class="mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2 font-normal disabled:cursor-not-allowed disabled:opacity-50" @input="onPageInput" />
        <p v-if="errors.currentPage" id="reading-page-error" role="alert" class="mt-1 text-sm font-normal text-danger">{{ errors.currentPage }}</p>
        <p v-else-if="entry.shelfEntry.totalPages === null" class="mt-1 text-xs font-normal text-muted">Chưa rõ tổng số trang nên không thể cập nhật tiến độ.</p>
      </div>
      <div class="sm:col-span-2">
        <p class="text-sm font-semibold">Đánh giá</p>
        <div class="mt-1 flex items-center gap-1" role="group" aria-label="Đánh giá từ 1 đến 5 sao">
          <button v-for="star in 5" :key="star" type="button" class="px-1 text-2xl text-[#b88732]" :aria-label="rating === star ? 'Bỏ đánh giá' : `${star} sao`" :aria-pressed="rating !== null && star <= rating" @click="rating = rating === star ? null : star; validate()">{{ star <= rating ? '★' : '☆' }}</button>
        </div>
        <p class="mt-1 text-xs text-muted">Nhấn lại số sao đã chọn để bỏ đánh giá.</p>
        <p v-if="errors.rating" role="alert" class="mt-1 text-sm font-normal text-danger">{{ errors.rating }}</p>
      </div>
      <div class="text-sm font-semibold sm:col-span-2">
        <label for="reading-notes">Ghi chú</label>
        <textarea id="reading-notes" v-model="notes" rows="3" maxlength="1000" :aria-invalid="!!errors.notes" class="mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2 font-normal" placeholder="Một vài cảm nhận về cuốn sách..." @input="validate"></textarea>
        <p v-if="errors.notes" role="alert" class="mt-1 text-sm font-normal text-danger">{{ errors.notes }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg bg-moss px-5 py-2.5 font-semibold text-white hover:bg-moss-dark disabled:opacity-60" :disabled="busy || !changed || hasErrors"><span v-if="busy" class="loading-spinner" aria-hidden="true"></span>{{ busy ? 'Đang lưu...' : 'Lưu thay đổi' }}</button>
        <button v-if="changed" type="button" class="rounded-lg border border-line px-5 py-2.5 font-semibold text-muted hover:border-moss hover:text-moss disabled:opacity-60" :disabled="busy" @click="reset">Hủy</button>
      </div>
    </form>
  </section>
</template>
