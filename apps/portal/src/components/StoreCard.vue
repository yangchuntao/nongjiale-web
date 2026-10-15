<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { priceLabel, storeTestLabel, type StoreCard } from '../api/readers'

defineProps<{ store: StoreCard }>()
</script>

<template>
  <RouterLink class="store-card" :to="`/listings/${store.id}`">
    <img v-if="store.coverUrl" class="cover" :src="store.coverUrl" :alt="store.name || '农家乐'" />
    <div v-else class="cover-fallback">暂无图片</div>
    <div class="body">
      <h3 class="card-title">{{ store.name || '未命名农家乐' }}</h3>
      <p class="muted">{{ store.regionName || '地区待补充' }}</p>
      <p v-if="priceLabel(store.priceText, store.priceFrom)">{{ priceLabel(store.priceText, store.priceFrom) }}</p>
      <div class="tag-row">
        <span v-if="storeTestLabel(store)" class="tag">{{ storeTestLabel(store) }}</span>
        <span v-if="store.homeRecommended" class="tag tag-info">首页推荐</span>
      </div>
    </div>
  </RouterLink>
</template>
