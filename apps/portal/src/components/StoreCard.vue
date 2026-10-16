<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { priceLabel, storeTestLabel, type StoreCard } from '../api/readers'

withDefaults(defineProps<{ store: StoreCard; layout?: 'grid' | 'row' }>(), { layout: 'grid' })
</script>

<template>
  <RouterLink class="store-card" :class="layout === 'row' ? 'layout-row' : 'layout-grid'" :to="`/listings/${store.id}`">
    <img v-if="store.coverUrl" class="cover" :src="store.coverUrl" :alt="store.name || '农家乐'" />
    <div v-else class="cover-fallback">暂无图片</div>
    <div class="body">
      <h3 class="card-title">{{ store.name || '未命名农家乐' }}</h3>
      <p class="muted">{{ store.regionName || '地区待补充' }}</p>
      <p v-if="priceLabel(store.priceText, store.priceFrom)" class="price">{{ priceLabel(store.priceText, store.priceFrom) }}</p>
      <div v-if="storeTestLabel(store)" class="tag-row">
        <span class="tag">{{ storeTestLabel(store) }}</span>
      </div>
    </div>
  </RouterLink>
</template>
