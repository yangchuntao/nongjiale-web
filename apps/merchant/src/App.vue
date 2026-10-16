<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import ConsoleFrame from './components/ConsoleFrame.vue'

const route = useRoute()
</script>

<template>
  <div v-if="route.meta.guestOnly" class="bare">
    <RouterView />
  </div>
  <ConsoleFrame v-else />
</template>

<style scoped>
.bare {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
  background: var(--color-surface-muted);
}
</style>
