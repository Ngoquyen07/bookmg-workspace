<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import DashboardBookCard from './DashboardBookCard.vue'
import { DASHBOARD_SECTIONS, DASHBOARD_MESSAGES as messages } from '../../../config/messageConfig.js'

const props = defineProps({ kind: { type: String, required: true }, list: { type: Object, required: true } })
const section = computed(() => DASHBOARD_SECTIONS[props.kind])
</script>

<template>
  <section :aria-labelledby="`dashboard-${kind}`" class="min-w-0">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 :id="`dashboard-${kind}`" class="font-display text-2xl font-bold text-ink sm:text-3xl">{{ section.title }}</h2>
      <span class="text-sm text-muted">{{ list.meta.total }} {{ messages.booksUnit }}</span>
    </div>
    <p class="mt-2 max-w-xl text-sm leading-6 text-muted">{{ section.description }}</p>
    <div v-if="list.data.length" class="mt-5 grid gap-4" :class="kind === 'continueReading' ? 'lg:grid-cols-2' : ''">
      <DashboardBookCard v-for="entry in list.data" :key="entry.shelfEntry.id" :entry="entry" :kind="kind" />
    </div>
    <p v-else class="mt-5 rounded-xl border border-dashed border-line px-5 py-9 text-sm leading-6 text-muted">{{ section.empty }}</p>
    <RouterLink :to="{ name: 'shelf', state: { shelfStatus: section.status } }" class="mt-4 inline-block text-sm font-semibold text-moss hover:underline">{{ messages.openShelf }}</RouterLink>
  </section>
</template>
