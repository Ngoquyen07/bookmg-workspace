<script setup>
import { shallowRef, watch } from 'vue'

const props = defineProps({ url: { type: String, default: null }, title: { type: String, required: true }, compact: Boolean })
const broken = shallowRef(false)
const loaded = shallowRef(false)
watch(() => props.url, () => { broken.value = false; loaded.value = false })
</script>

<template>
  <div class="book-shadow relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-[3px] bg-cover-empty text-center text-sm text-ink">
    <img v-if="url && !broken" :src="url" :alt="`Bìa sách ${title}`" loading="lazy" class="absolute inset-0 h-full w-full object-cover" :class="loaded ? 'opacity-100' : 'opacity-0'" @load="loaded = true" @error="broken = true" />
    <span v-if="url && !loaded && !broken" class="loading-spinner" aria-hidden="true"></span>
    <span v-else-if="!url || broken" class="font-display leading-snug" :class="compact ? 'line-clamp-4 px-2 text-xs' : 'px-4 text-lg sm:text-xl'">{{ title }}</span>
  </div>
</template>
