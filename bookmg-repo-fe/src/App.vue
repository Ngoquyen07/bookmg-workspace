<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <AppHeader />
    <RouterView />
  </div>
</template>
