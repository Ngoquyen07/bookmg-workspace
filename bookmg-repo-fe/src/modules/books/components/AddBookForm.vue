<script setup>
import { shallowRef } from 'vue'
import DropdownSelect from '../../../components/DropdownSelect.vue'

defineProps({ busy: Boolean })
const emit = defineEmits(['submit'])
const status = shallowRef('want_to_read')
const statusOptions = [
  { value: 'want_to_read', label: 'Muốn đọc' },
  { value: 'reading', label: 'Đang đọc' },
  { value: 'finished', label: 'Đã đọc' },
]
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit', status)">
    <div class="max-w-xs text-sm font-semibold">
      <label for="initial-reading-status">Trạng thái ban đầu</label>
      <DropdownSelect id="initial-reading-status" :model-value="status" label="Trạng thái ban đầu" :options="statusOptions" class="mt-1 font-normal" @update:model-value="status = $event" />
    </div>
    <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg bg-moss px-5 py-2.5 font-semibold text-white hover:bg-moss-dark disabled:opacity-60" :disabled="busy"><span v-if="busy" class="loading-spinner" aria-hidden="true"></span>{{ busy ? 'Đang thêm...' : 'Thêm vào tủ sách' }}</button>
  </form>
</template>
