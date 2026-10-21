<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchMerchantStores, fetchShelfApplications } from '../api/merchant'
import { priceLabel, shelfStatusLabel, type StoreDetail } from '../api/readers'
import { EMPTY_STORES } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const site = useSiteStore()
const { loading, error, errorKind, run } = useLoadState()
const result = ref<PageResult<StoreDetail> | null>(null)
const pendingIds = ref<Set<string>>(new Set())

const pendingCount = computed(() => pendingIds.value.size)
const shownCount = computed(
  () => result.value?.items.filter((row) => row.shelfStatus === 'ON_SHELF' || row.shelfStatus === 'PUBLISHED').length ?? 0,
)

const page = computed(() => {
  const raw = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
  const value = Number(raw || '1')
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
})

async function load() {
  const outcome = await run(async (signal) => {
    const stores = await fetchMerchantStores(page.value, signal)
    const pending = new Set<string>()
    try {
      // 待审集合必须翻页拉全：单页 100 条会漏标「待运营审核」。上限 10 页（1000 条）防御异常数据。
      const PAGE_SIZE = 100
      const MAX_PAGES = 10
      let fetched = 0
      let total = Infinity
      for (let pageNo = 1; fetched < total && pageNo <= MAX_PAGES; pageNo++) {
        const applications = await fetchShelfApplications({ page: pageNo, pageSize: PAGE_SIZE }, signal)
        total = applications.total
        fetched += applications.items.length
        for (const item of applications.items) {
          if (item.status === 'PENDING' && item.storeId) pending.add(item.storeId)
        }
        if (applications.items.length < PAGE_SIZE) break
      }
    } catch (cause) {
      if (signal.aborted) throw cause
    }
    return { stores, pending }
  })
  if (outcome.status === 'ok') {
    result.value = outcome.data.stores
    pendingIds.value = outcome.data.pending
  }
  if (outcome.status === 'error') {
    result.value = null
    if (await leaveIfDisabled(errorKind.value, auth, router)) return
  }
}

function changePage(next: number) {
  void router.push(next <= 1 ? '/stores' : { path: '/stores', query: { page: String(next) } })
}

watch(page, () => void load(), { immediate: true })
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>门店</h1>
        <p class="desc">门店由运营代为开通。开通后可在此维护房源、查看游客发来的入住意向。</p>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="k">我的门店</span>
        <span class="v">{{ result?.total ?? 0 }}<small>处</small></span>
      </div>
      <div class="stat stat--brand">
        <span class="k">待审上下架</span>
        <span class="v">{{ pendingCount }}<small>条</small></span>
      </div>
      <div class="stat stat--gold">
        <span class="k">当前展示中</span>
        <span class="v">{{ shownCount }}<small>处</small></span>
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-empty v-else-if="!result?.items.length" :description="EMPTY_STORES">
      <a v-if="site.phone" :href="`tel:${site.phone}`">联系客服 {{ site.phone }}</a>
    </el-empty>
    <template v-else>
      <div class="block-head">
        <div>
          <h2>门店列表</h2>
          <div class="sub">由运营开通后展示在这里</div>
        </div>
      </div>
      <ul class="stores">
        <li v-for="row in result.items" :key="row.id" class="store-row">
          <div class="store-row__thumb">
            <img v-if="row.coverUrl" :src="row.coverUrl" :alt="row.name || '门店'" />
            <div v-else class="cover-art cover-art--paddy" aria-hidden="true"></div>
          </div>
          <div class="store-row__body">
            <div class="store-row__name">{{ row.name || '未命名门店' }}</div>
            <div class="store-row__meta">
              <span>地区 {{ row.regionId ?? '待补充' }}</span>
              <span class="dot" aria-hidden="true"></span>
              <span>{{ priceLabel(row.priceText, row.priceFrom) || '价格待补充' }}</span>
              <el-tag :type="row.shelfStatus === 'ON_SHELF' || row.shelfStatus === 'PUBLISHED' ? 'success' : 'info'">
                {{ shelfStatusLabel(row.shelfStatus) }}
              </el-tag>
              <el-tag v-if="pendingIds.has(row.id)" type="warning">待运营审核</el-tag>
            </div>
          </div>
          <div class="store-row__acts">
            <RouterLink :to="`/stores/${row.id}`">
              <el-button size="small">管理房源</el-button>
            </RouterLink>
            <RouterLink :to="`/stores/${row.id}/shelf`">
              <el-button size="small" text>查看上下架</el-button>
            </RouterLink>
          </div>
        </li>
      </ul>
      <el-pagination
        v-if="result.total > result.pageSize"
        layout="prev, pager, next"
        :total="result.total"
        :page-size="result.pageSize"
        :current-page="result.page || page"
        @current-change="changePage"
      />
    </template>
  </section>
</template>
