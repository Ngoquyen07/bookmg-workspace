<script setup>
import { RouterLink } from 'vue-router'
import { useDashboard } from '../modules/dashboard/composables/useDashboard.js'
import DashboardStats from '../modules/dashboard/components/DashboardStats.vue'
import DashboardSection from '../modules/dashboard/components/DashboardSection.vue'
import { DASHBOARD_MESSAGES as messages } from '../config/messageConfig.js'

const { dashboard, loading, error, refresh } = useDashboard()
</script>

<template>
  <main class="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
    <header class="flex flex-wrap items-end justify-between gap-5">
      <div class="max-w-2xl">
        <h1 class="font-display text-4xl font-bold tracking-tight sm:text-6xl">{{ messages.title }}</h1>
        <p class="mt-3 leading-7 text-muted">{{ messages.description }}</p>
      </div>
      <RouterLink :to="{ name: 'search' }" class="rounded-lg bg-moss px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss-dark">{{ messages.discover }}</RouterLink>
    </header>
    <div v-if="loading" role="status" class="screen-loading text-muted"><span class="loading-spinner loading-spinner-lg" aria-hidden="true"></span>{{ messages.loading }}</div>
    <div v-if="error" role="alert" class="mt-8 rounded-xl border border-line bg-danger-surface p-5 text-danger">
      <p>{{ messages.error }} {{ error }}</p>
      <button type="button" class="mt-3 font-semibold underline" :disabled="loading" @click="refresh">{{ messages.retry }}</button>
    </div>
    <template v-if="dashboard">
      <DashboardStats class="mt-9" :stats="dashboard.stats" />
      <div v-if="dashboard.stats.total === 0" class="mt-10 rounded-xl border border-line bg-surface px-6 py-14 text-center sm:px-12">
        <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto h-14 w-14 text-moss"><path d="M24 10c-6-4-13-4-19-2v29c6-2 13-2 19 2 6-4 13-4 19-2V8c-6-2-13-2-19 2Zm0 0v29M10 15h8m-8 6h8m12-6h8m-8 6h8" /></svg>
        <h2 class="mx-auto mt-5 max-w-lg font-display text-2xl font-bold sm:text-3xl">{{ messages.emptyTitle }}</h2>
        <p class="mx-auto mt-3 max-w-lg leading-7 text-muted">{{ messages.emptyDescription }}</p>
        <RouterLink :to="{ name: 'search' }" class="mt-6 inline-block rounded-lg bg-moss px-5 py-3 text-sm font-semibold text-white hover:bg-moss-dark">{{ messages.discover }}</RouterLink>
      </div>
      <div v-else class="mt-10 space-y-10 sm:mt-12 sm:space-y-12">
        <DashboardSection kind="continueReading" :list="dashboard.continueReading" />
        <div class="grid gap-10 border-t border-line pt-10 lg:grid-cols-2 lg:gap-8">
          <DashboardSection kind="nearlyFinished" :list="dashboard.nearlyFinished" />
          <DashboardSection kind="recentlyFinished" :list="dashboard.recentlyFinished" />
        </div>
      </div>
    </template>
  </main>
</template>
