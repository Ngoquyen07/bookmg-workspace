<script setup>
import { computed, nextTick, onMounted, onUnmounted, shallowRef } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])
const open = shallowRef(false)
const root = shallowRef(null)
const menu = shallowRef(null)
const trigger = shallowRef(null)
const selectedLabel = computed(() => props.options.find(option => option.value === props.modelValue)?.label ?? '')

function closeOutside(event) {
  if (!root.value?.contains(event.target)) open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', closeOutside)
  document.addEventListener('focusin', closeOutside)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', closeOutside)
  document.removeEventListener('focusin', closeOutside)
})

async function show() {
  open.value = true
  await nextTick()
  menu.value?.querySelector('[aria-checked="true"]')?.focus()
}

function close() {
  open.value = false
  trigger.value?.focus()
}

function choose(value) {
  emit('update:modelValue', value)
  close()
}

function move(event, direction) {
  const buttons = [...menu.value.querySelectorAll('button')]
  const index = buttons.indexOf(document.activeElement)
  buttons[(index + direction + buttons.length) % buttons.length]?.focus()
  event.preventDefault()
}
</script>

<template>
  <div ref="root" class="relative min-w-36" @keydown.esc.prevent="close">
    <button :id="id" ref="trigger" type="button" class="flex min-h-12 w-full items-center justify-between gap-4 rounded-lg border border-line bg-paper px-3 text-sm text-ink" :aria-label="`${label}: ${selectedLabel}`" aria-haspopup="menu" :aria-controls="open ? `${id}-menu` : undefined" :aria-expanded="open" @click="open ? close() : show()" @keydown.down.prevent="show">
      {{ selectedLabel }}
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div v-if="open" :id="`${id}-menu`" ref="menu" role="menu" :aria-label="label" class="absolute left-0 top-full z-30 mt-2 w-full min-w-36 rounded-lg border border-line bg-surface p-1.5 text-ink shadow-xl" @keydown.down="move($event, 1)" @keydown.up="move($event, -1)">
      <button v-for="option in options" :key="option.value" type="button" role="menuitemradio" :aria-checked="modelValue === option.value" class="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm hover:bg-paper focus:bg-paper" @click="choose(option.value)">
        {{ option.label }} <span v-if="modelValue === option.value" aria-hidden="true" class="text-moss">✓</span>
      </button>
    </div>
  </div>
</template>
