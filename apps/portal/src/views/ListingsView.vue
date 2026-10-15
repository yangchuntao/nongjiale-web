<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchRegions, fetchStores } from '../api/portal'
import { readRouteQueryValue } from '../api/query'
import type { RegionItem, StoreCard } from '../api/readers'
import EmptyState from '../components/EmptyState.vue'
import Pager from '../components/Pager.vue'
import StoreCardView from '../components/StoreCard.vue'
import { PRICE_BANDS, SORT_OPTIONS, normalizeSort, orderRegions, priceBandId } from '../domain/filters'
import { useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const { loading, error, run } = useLoadState()
const regions = ref<RegionItem[]>([])
const result = ref<PageResult<StoreCard> | null>(null)
const tagDraft = ref('')
const filtersOpen = ref(true)

const params = computed(() => ({
  regionId: readRouteQueryValue(route.query.regionId)?.trim() || undefined,
  tag: readRouteQueryValue(route.query.tag)?.trim() || undefined,
  priceMin: readRouteQueryValue(route.query.priceMin)?.trim() || undefined,
  priceMax: readRouteQueryValue(route.query.priceMax)?.trim() || undefined,
  sort: normalizeSort(readRouteQueryValue(route.query.sort)?.trim()),
  page: readRouteQueryValue(route.query.page)?.trim() || undefined,
}))

const page = computed(() => Number(params.value.page || '1') || 1)
const band = computed(() => priceBandId(params.value.priceMin ?? '', params.value.priceMax ?? ''))
const ordered = computed(() => orderRegions(regions.value))

watch(
  () => route.query.tag,
  (value) => {
    tagDraft.value = readRouteQueryValue(value)?.trim() ?? ''
  },
  { immediate: true },
)

async function load() {
  const outcome = await run((signal) => fetchStores(params.value, signal))
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') result.value = null
}

watch(params, () => void load(), { immediate: true })

onMounted(() => {
  if (window.matchMedia('(max-width: 767px)').matches) filtersOpen.value = false
  void fetchRegions()
    .then((items) => {
      regions.value = items
    })
    .catch(() => {
      regions.value = []
    })
})

function push(patch: Record<string, string | undefined>, resetPage = true) {
  const next: Record<string, string | undefined> = { ...params.value, ...patch }
  if (next.sort === 'comprehensive') delete next.sort
  if (resetPage) delete next.page
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(next)) {
    if (value) query[key] = value
  }
  void router.push({ path: '/listings', query })
}

function onBand(id: string) {
  if (id === 'custom') return
  const selected = PRICE_BANDS.find((item) => item.id === id)
  push({ priceMin: selected?.priceMin || undefined, priceMax: selected?.priceMax || undefined })
}

function applyTag() {
  push({ tag: tagDraft.value.trim() || undefined })
}

function clearFilters() {
  tagDraft.value = ''
  void router.push('/listings')
}

function changePage(next: number) {
  push({ page: next <= 1 ? undefined : String(next) }, false)
}
</script>

<template>
  <section>
    <div class="page-head">
      <h1>找农家乐</h1>
      <p class="lede">按地区、特色和价格缩小范围。列表只展示上架房源。</p>
    </div>

    <button class="btn btn-secondary" type="button" @click="filtersOpen = !filtersOpen">
      {{ filtersOpen ? '收起筛选' : '筛选' }}
    </button>
    <form v-show="filtersOpen" class="filters-bar" @submit.prevent="applyTag">
      <label class="field">
        <span>地区</span>
        <select :value="params.regionId ?? ''" @change="push({ regionId: ($event.target as HTMLSelectElement).value || undefined })">
          <option value="">全部地区</option>
          <option v-for="region in ordered" :key="region.id" :value="String(region.id)">
            {{ region.parentId ? `－ ${region.name}` : region.name }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>特色</span>
        <input v-model="tagDraft" type="search" placeholder="输入特色" @change="applyTag" />
      </label>
      <label class="field">
        <span>价格</span>
        <select :value="band" @change="onBand(($event.target as HTMLSelectElement).value)">
          <option v-if="band === 'custom'" value="custom">当前价格</option>
          <option v-for="item in PRICE_BANDS" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </label>
      <label class="field">
        <span>排序</span>
        <select :value="params.sort" @change="push({ sort: ($event.target as HTMLSelectElement).value })">
          <option v-for="item in SORT_OPTIONS" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </label>
    </form>
    <p>
      <button class="btn btn-secondary" type="button" @click="clearFilters">清空筛选</button>
    </p>

    <div v-if="loading" class="card-grid" aria-busy="true">
      <div v-for="item in 4" :key="item" class="skeleton-card"></div>
    </div>
    <EmptyState v-else-if="error" :title="error">
      <button class="btn btn-secondary" type="button" @click="load">列表加载失败，请重试</button>
    </EmptyState>
    <EmptyState v-else-if="!result?.items.length" title="没有符合条件的农家乐，试试调整筛选" action="清空筛选" to="/listings" />
    <template v-else>
      <div class="card-grid">
        <StoreCardView v-for="store in result.items" :key="store.id" :store="store" />
      </div>
      <Pager :page="result.page || page" :page-size="result.pageSize" :total="result.total" @change="changePage" />
    </template>
  </section>
</template>
