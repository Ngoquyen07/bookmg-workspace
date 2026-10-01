<script setup>
defineProps({ busy: Boolean })
const emit = defineEmits(['submit'])
</script>

<template>
  <form @submit.prevent="emit('submit')">
    <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg bg-moss px-5 py-2.5 font-semibold text-white hover:bg-moss-dark disabled:opacity-60" :disabled="busy"><span v-if="busy" class="loading-spinner" aria-hidden="true"></span>{{ busy ? 'Đang thêm...' : 'Thêm vào tủ sách' }}</button>
  </form>
</template>
