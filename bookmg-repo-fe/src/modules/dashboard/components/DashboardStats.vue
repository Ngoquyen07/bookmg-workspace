<script setup>
import { DASHBOARD_STATS } from '../../../config/messageConfig.js'

defineProps({ stats: { type: Object, required: true } })
</script>

<template>
  <dl class="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-4">
    <div v-for="(item, index) in DASHBOARD_STATS" :key="item.key" class="px-5 py-5 sm:px-7 sm:py-6" :class="{ 'border-l border-line': index % 2 !== 0, 'border-t border-line sm:border-t-0': index > 1, 'sm:border-l': index === 2 }">
      <dt class="text-sm text-muted">{{ item.label }}</dt>
      <dd class="mt-2 font-display text-4xl font-bold sm:text-5xl" :class="item.key === 'reading' ? 'text-moss' : 'text-ink'">{{ stats[item.key].toLocaleString('vi-VN') }}</dd>
    </div>
  </dl>
</template>
