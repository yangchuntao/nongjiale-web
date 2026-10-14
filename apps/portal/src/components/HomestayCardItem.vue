<script setup lang="ts">
import type { HomestayCard } from '@nongjiale/shared'

defineProps<{ item: HomestayCard }>()
</script>

<template>
  <router-link :to="`/homestays/${item.id}`" class="card h-card" style="display:block;color:inherit;text-decoration:none">
    <div class="cover" :style="item.coverUrl ? { backgroundImage: `url(${item.coverUrl})` } : undefined" />
    <h3>{{ item.name }}</h3>
    <p class="muted">{{ item.address }}</p>
    <p>
      <span class="price">¥{{ item.priceFrom }}</span>
      <span class="muted"> 起 · 销量 {{ item.salesCount }}</span>
    </p>
  </router-link>
</template>

<style scoped>
.cover {
  height: 120px;
  border-radius: 8px;
  background: linear-gradient(120deg, #d7e8d9, #f0e6c8);
  background-size: cover;
  background-position: center;
  margin-bottom: 10px;
}
</style>
