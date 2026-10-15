<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{ title: string; action?: string; to?: string }>()
</script>

<template>
  <div class="empty-state">
    <p>{{ title }}</p>
    <RouterLink v-if="action && to" class="btn btn-secondary" :to="to">{{ action }}</RouterLink>
    <slot />
  </div>
</template>
