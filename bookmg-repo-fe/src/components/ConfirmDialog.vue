<script setup>
import { shallowRef, watch } from 'vue'

const props = defineProps({ open: Boolean, title: { type: String, required: true }, busy: Boolean })
const emit = defineEmits(['close', 'confirm'])
const dialog = shallowRef(null)
watch(() => props.open, value => {
  if (value && !dialog.value?.open) dialog.value?.showModal()
  if (!value && dialog.value?.open) dialog.value?.close()
})
</script>

<template>
  <dialog ref="dialog" class="m-auto w-[min(92vw,430px)] rounded-xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-black/50" @close="emit('close')" @cancel.prevent="emit('close')">
    <div class="p-7">
      <h2 class="font-display text-2xl font-bold">Xóa khỏi tủ sách?</h2>
      <p class="mt-3 text-muted">“{{ title }}” và tiến độ đọc của sách sẽ bị xóa.</p>
      <div class="mt-7 flex justify-end gap-3">
        <button type="button" class="rounded-lg border border-line px-4 py-2" :disabled="busy" @click="emit('close')">Giữ lại</button>
        <button type="button" class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a43830] px-4 py-2 font-semibold text-white disabled:opacity-60" :disabled="busy" @click="emit('confirm')"><span v-if="busy" class="loading-spinner" aria-hidden="true"></span>{{ busy ? 'Đang xóa...' : 'Xóa sách' }}</button>
      </div>
    </div>
  </dialog>
</template>
