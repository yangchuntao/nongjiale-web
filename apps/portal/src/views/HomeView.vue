<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { HomestayCard, Region } from '@nongjiale/shared'
import * as api from '../api'
import HomestayCardItem from '../components/HomestayCardItem.vue'

const regions = ref<Region[]>([])
const hot = ref<HomestayCard[]>([])
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const feed = await api.fetchHomeFeed()
    regions.value = feed.regions
    hot.value = feed.hotHomestays
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section>
    <div class="hero">
      <h1>长三角农家乐意向预订</h1>
      <p>登录后提交意向，客服电话确认；无在线支付、无订单列表。</p>
      <div class="actions">
        <router-link class="btn" to="/search">浏览民宿</router-link>
        <router-link class="btn secondary" to="/login">游客登录</router-link>
      </div>
    </div>

    <p v-if="loading" class="muted">加载中…</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <template v-else>
      <h2 class="page-title">热门地区</h2>
      <div class="chips">
        <router-link
          v-for="r in regions"
          :key="r.id"
          class="chip"
          :to="`/regions/${r.slug}`"
        >{{ r.name }}</router-link>
      </div>

      <h2 class="page-title">热门农家乐</h2>
      <div class="grid">
        <HomestayCardItem v-for="h in hot" :key="h.id" :item="h" />
      </div>
      <p v-if="!hot.length" class="muted">暂无上架房源</p>
    </template>
  </section>
</template>
