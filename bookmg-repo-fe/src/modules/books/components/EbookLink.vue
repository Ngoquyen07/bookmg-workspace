<script setup>
import { EBOOK_MESSAGES } from '../../../config/messageConfig.js'

defineProps({ url: { type: String, default: null } })
</script>

<template>
  <section v-if="url" class="mt-6" aria-label="Ebook">
    <h2 class="text-sm font-semibold text-ink">{{ EBOOK_MESSAGES.label }}</h2>
    <a :href="url" target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex rounded-lg border border-moss px-4 py-2 text-sm font-semibold text-moss hover:bg-moss hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss">{{ EBOOK_MESSAGES.open }}</a>
    <p class="mt-2 text-xs leading-5 text-muted">{{ EBOOK_MESSAGES.hint }}</p>
  </section>
</template>
