<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { HomestayCard, Region } from '@nongjiale/shared'
import * as api from '../api'
import HomestayCardItem from '../components/HomestayCardItem.vue'

const route = useRoute()
const router = useRouter()
const regions = ref<Region[]>([])
const items = ref<HomestayCard[]>([])
const total = ref(0)
const keyword = ref((route.query.q as string) || '')
const error = ref('')
const loading = ref(false)

const slug = computed(() => (route.params.slug as string) || '')

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!regions.value.length) regions.value = await api.fetchRegions()
    const page = await api.fetchHomestays({
      regionSlug: slug.value || undefined,
      keyword: keyword.value || undefined,
      page: 1,
      pageSize: 20,
    })
    items.value = page.items
    total.value = page.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function search() {
  router.replace({ path: '/search', query: keyword.value ? { q: keyword.value } : {} })
}

onMounted(load)
watch(() => [route.params.slug, route.query.q], () => {
  keyword.value = (route.query.q as string) || keyword.value
  load()
})
</script>

<template>
  <section>
    <h1 class="page-title">{{ slug ? `地区：${slug}` : '搜索民宿' }}</h1>
    <form class="card" @submit.prevent="search">
      <div class="field">
        <label>关键词</label>
        <input v-model="keyword" placeholder="民宿名称 / 地址" />
      </div>
      <button class="btn" type="submit">搜索</button>
    </form>

    <div class="chips">
      <router-link class="chip" :class="{ active: !slug }" to="/search">全部</router-link>
      <router-link
        v-for="r in regions"
        :key="r.id"
        class="chip"
        :class="{ active: slug === r.slug }"
        :to="`/regions/${r.slug}`"
      >{{ r.name }}</router-link>
    </div>

    <p v-if="loading" class="muted">加载中…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <template v-else>
      <p class="muted">共 {{ total }} 家</p>
      <div class="grid">
        <HomestayCardItem v-for="h in items" :key="h.id" :item="h" />
      </div>
      <p v-if="!items.length" class="muted">没有匹配的上架房源</p>
    </template>
  </section>
</template>
