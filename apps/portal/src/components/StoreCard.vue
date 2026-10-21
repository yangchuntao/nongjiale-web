<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { priceLabel, storeTestLabel, type StoreCard } from '../api/readers'

const props = withDefaults(defineProps<{ store: StoreCard; layout?: 'grid' | 'row' }>(), { layout: 'grid' })

const price = computed(() => priceLabel(props.store.priceText, props.store.priceFrom))
const badge = computed(() => storeTestLabel(props.store))
</script>

<template>
  <RouterLink class="stay" :class="layout === 'row' ? 'layout-row' : 'layout-grid'" :to="`/listings/${store.id}`">
    <div class="stay__cover">
      <img v-if="store.coverUrl" class="cover" :src="store.coverUrl" :alt="store.name || '农家乐'" />
      <div v-else class="cover-fallback">暂无图片</div>
      <div v-if="badge" class="stay__badges">
        <span class="tag tag-brand">{{ badge }}</span>
      </div>
    </div>
    <div class="stay__body">
      <h3 class="stay__name">{{ store.name || '未命名农家乐' }}</h3>
      <p class="stay__meta">
        <span>{{ store.regionName || '地区待补充' }}</span>
      </p>
      <div class="stay__foot">
        <p v-if="price" class="price">{{ price }}</p>
        <span v-else class="stay__hint">价格联系客服确认</span>
        <span class="stay__hint">先提意向 →</span>
      </div>
    </div>
  </RouterLink>
</template>
