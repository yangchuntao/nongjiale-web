<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchRegions, fetchStores } from '../api/portal'
import { readRouteQueryValue } from '../api/query'
import { CLOSED_DESTINATION_HINT, type RegionItem, type StoreListResult } from '../api/readers'
import EmptyState from '../components/EmptyState.vue'
import Pager from '../components/Pager.vue'
import StoreCardView from '../components/StoreCard.vue'
import { DESTINATION_CLOSED_BODY, DESTINATION_OPEN_EMPTY, LISTINGS_LEAD } from '../domain/copy'
import { PRICE_BANDS, SORT_OPTIONS, normalizeSort, orderRegions, priceBandId } from '../domain/filters'
import { useSiteStore } from '../stores/site'
import { useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const site = useSiteStore()
const { loading, error, run } = useLoadState()
const regions = ref<RegionItem[]>([])
const result = ref<StoreListResult | null>(null)
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
    <header class="list-head">
      <nav class="crumbs" aria-label="位置">
        <RouterLink to="/">首页</RouterLink>
        <span aria-hidden="true">/</span>
        <span class="now">找农家乐</span>
      </nav>
      <h1>找农家乐</h1>
      <p class="desc">{{ LISTINGS_LEAD }}</p>
    </header>

    <div class="list-layout">
      <div class="filters__bar">
        <button class="btn-text filter-toggle" type="button" @click="filtersOpen = !filtersOpen">
          {{ filtersOpen ? '收起筛选' : '筛选' }}
        </button>
        <span v-if="!loading && result" class="result-bar-inline">
          共 <b>{{ result.total }}</b> 家
        </span>
      </div>

      <form v-show="filtersOpen" class="filter-panel" @submit.prevent="applyTag">
        <div class="field">
          <span>地区</span>
          <div class="chips chips-wrap">
            <button type="button" class="chip" :class="{ active: !params.regionId }" @click="push({ regionId: undefined })">
              全部
            </button>
            <button
              v-for="region in ordered"
              :key="region.id"
              type="button"
              class="chip"
              :class="{ active: params.regionId === String(region.id) }"
              @click="push({ regionId: String(region.id) })"
            >
              {{ region.parentId ? `－ ${region.name}` : region.name }}
            </button>
          </div>
        </div>
        <div class="field">
          <span>特色</span>
          <div class="filters__bar">
            <label class="search grow-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" stroke-linecap="round" />
              </svg>
              <input v-model="tagDraft" type="search" placeholder="输入特色" aria-label="按特色搜索" @change="applyTag" />
            </label>
            <button class="btn btn-secondary btn-sm" type="submit">应用</button>
          </div>
        </div>
        <div class="field">
          <span>价格</span>
          <div class="chips chips-wrap">
            <button v-if="band === 'custom'" type="button" class="chip active">当前价格</button>
            <button
              v-for="item in PRICE_BANDS"
              :key="item.id"
              type="button"
              class="chip"
              :class="{ active: band === item.id }"
              @click="onBand(item.id)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
        <div class="field">
          <span>排序</span>
          <div class="segmented" role="group" aria-label="排序">
            <button
              v-for="item in SORT_OPTIONS"
              :key="item.id"
              type="button"
              :class="{ active: params.sort === item.id }"
              @click="push({ sort: item.id })"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
        <button class="btn-text" type="button" @click="clearFilters">清空筛选</button>
      </form>

      <div class="list-results">
        <div v-if="loading" class="list-stack" aria-busy="true">
          <div v-for="item in 4" :key="item" class="skeleton-row"></div>
        </div>
        <EmptyState v-else-if="error" :title="error">
          <button class="btn btn-secondary" type="button" @click="load">列表加载失败，请重试</button>
        </EmptyState>
        <EmptyState
          v-else-if="result?.destinationStatus === 'CLOSED'"
          :title="result.emptyHint || CLOSED_DESTINATION_HINT"
        >
          <p>{{ DESTINATION_CLOSED_BODY }}</p>
          <RouterLink class="btn btn-primary" to="/">查看已开通目的地</RouterLink>
          <RouterLink class="btn btn-secondary" to="/listings">找农家乐</RouterLink>
        </EmptyState>
        <EmptyState
          v-else-if="result?.destinationStatus === 'OPEN' && !result.items.length"
          :title="DESTINATION_OPEN_EMPTY"
          action="找农家乐"
          to="/listings"
        />
        <EmptyState v-else-if="!result?.items.length" title="没有符合条件的农家乐" action="清空筛选" to="/listings">
          <a v-if="site.phone" class="text-link" :href="`tel:${site.phone.replace(/\s+/g, '')}`">联系客服 {{ site.phone }}</a>
        </EmptyState>
        <template v-else>
          <div class="result-bar">
            <span>共 <b>{{ result.total }}</b> 家可提交意向的农家乐</span>
            <span class="row">按价格由低到高查看 · 客服确认档期</span>
          </div>
          <div class="list-stack">
            <StoreCardView v-for="store in result.items" :key="store.id" layout="row" :store="store" />
          </div>
          <Pager :page="result.page || page" :page-size="result.pageSize" :total="result.total" @change="changePage" />
        </template>
      </div>
    </div>
  </section>
</template>
