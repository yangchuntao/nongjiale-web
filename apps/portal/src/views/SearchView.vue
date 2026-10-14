<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { HomestayCard, Region } from '@nongjiale/shared'
import * as api from '../api'
import HomestayCardItem from '../components/HomestayCardItem.vue'

const route = useRoute()
const router = useRouter()
const regions = ref<Region[]>([])
const items = ref<HomestayCard[]>([])
const total = ref(0)
const keyword = ref('')
const tag = ref('')
const sort = ref('default')
const page = ref(1)
const pageSize = 10
const error = ref('')
const loading = ref(false)

const slug = computed(() => (route.params.slug as string) || '')
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function readQuery() {
  keyword.value = typeof route.query.q === 'string' ? route.query.q : ''
  tag.value = typeof route.query.tag === 'string' ? route.query.tag : ''
  const nextSort = route.query.sort
  sort.value = nextSort === 'price' || nextSort === 'sales' || nextSort === 'default' ? nextSort : 'default'
}

function buildQuery() {
  const query: Record<string, string> = {}
  if (keyword.value.trim()) query.q = keyword.value.trim()
  if (tag.value.trim()) query.tag = tag.value.trim()
  if (sort.value && sort.value !== 'default') query.sort = sort.value
  return query
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!regions.value.length) {
      const data = await api.fetchRegions()
      regions.value = Array.isArray(data) ? data : []
    }
    const result = await api.fetchHomestays({
      regionSlug: slug.value || undefined,
      keyword: keyword.value.trim() || undefined,
      tag: tag.value.trim() || undefined,
      sort: sort.value && sort.value !== 'default' ? sort.value : undefined,
      page: page.value,
      pageSize,
    })
    items.value = Array.isArray(result?.items) ? result.items : []
    total.value = typeof result?.total === 'number' ? result.total : items.value.length
  } catch (e) {
    items.value = []
    total.value = 0
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  const dest = router.resolve({ path: '/search', query: buildQuery() })
  if (dest.fullPath === route.fullPath) load()
  else router.push({ path: '/search', query: buildQuery() })
}

function goRegion(nextSlug?: string) {
  page.value = 1
  const location = nextSlug
    ? { path: `/regions/${nextSlug}`, query: buildQuery() }
    : { path: '/search', query: buildQuery() }
  if (router.resolve(location).fullPath === route.fullPath) load()
  else router.push(location)
}

function changePage(next: number) {
  page.value = next
  load()
}

watch(
  () => [route.params.slug, route.query.q, route.query.tag, route.query.sort],
  () => {
    readQuery()
    page.value = 1
    load()
  },
  { immediate: true },
)
</script>

<template>
  <section>
    <h1 class="page-title">{{ slug ? `地区：${slug}` : '搜索民宿' }}</h1>
    <form class="card" @submit.prevent="search">
      <div class="field">
        <label for="keyword">关键词</label>
        <input id="keyword" v-model="keyword" placeholder="民宿名称 / 地址" />
      </div>
      <div class="field">
        <label for="tag">特色标签</label>
        <input id="tag" v-model="tag" placeholder="精确匹配，例如 亲子" />
      </div>
      <div class="field">
        <label for="sort">排序</label>
        <select id="sort" v-model="sort">
          <option value="default">综合</option>
          <option value="price">价格</option>
          <option value="sales">销量</option>
        </select>
      </div>
      <button class="btn" type="submit">搜索</button>
    </form>

    <div class="chips">
      <button class="chip" :class="{ active: !slug }" type="button" @click="goRegion()">全部</button>
      <button
        v-for="r in regions"
        :key="r.id"
        class="chip"
        :class="{ active: slug === r.slug }"
        type="button"
        @click="goRegion(r.slug)"
      >{{ r.name }}</button>
    </div>

    <p v-if="loading" class="muted">加载中…</p>
    <p v-else-if="error" class="error">
      {{ error }}
      <button class="btn secondary" type="button" @click="load">重试</button>
    </p>
    <template v-else>
      <p class="muted">共 {{ total }} 家</p>
      <div class="grid">
        <HomestayCardItem v-for="h in items" :key="h.id" :item="h" />
      </div>
      <p v-if="!items.length" class="muted">没有匹配的上架房源</p>
      <div v-if="total > pageSize" class="actions">
        <button class="btn secondary" type="button" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <span class="muted">{{ page }} / {{ pageCount }}</span>
        <button class="btn secondary" type="button" :disabled="page >= pageCount" @click="changePage(page + 1)">下一页</button>
      </div>
    </template>
  </section>
</template>
