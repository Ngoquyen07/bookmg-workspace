<script setup>
import { shallowRef } from 'vue'
import { RouterLink } from 'vue-router'

const dark = shallowRef(localStorage.getItem('bookmg-theme') === 'dark')
document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'

function toggleTheme() {
  dark.value = !dark.value
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
  localStorage.setItem('bookmg-theme', dark.value ? 'dark' : 'light')
}
</script>

<template>
  <header class="relative z-10 border-b border-line bg-surface">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <RouterLink to="/" class="flex items-center text-ink" aria-label="Trang tìm sách">
        <span aria-hidden="true" class="flex h-10 w-10 items-center justify-center rounded-md bg-[#162c29] font-display text-2xl font-bold text-white">B</span>
      </RouterLink>
      <nav aria-label="Điều hướng chính" class="flex items-center gap-1 text-sm font-semibold sm:gap-3">
        <RouterLink to="/" class="rounded-md px-3 py-2 text-muted hover:bg-paper hover:text-ink sm:px-4" active-class="!bg-paper !text-ink">Khám phá</RouterLink>
        <RouterLink to="/shelf" class="rounded-md px-3 py-2 text-muted hover:bg-paper hover:text-ink sm:px-4" active-class="!bg-paper !text-ink">Tủ sách</RouterLink>
        <button type="button" class="ml-1 flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink hover:bg-paper" :aria-label="dark ? 'Bật chế độ sáng' : 'Bật chế độ tối'" :title="dark ? 'Chế độ sáng' : 'Chế độ tối'" @click="toggleTheme">
          <svg v-if="dark" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>
          <svg v-else aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/></svg>
        </button>
      </nav>
    </div>
  </header>
</template>
