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
      const applications = await fetchShelfApplications({ page: 1, pageSize: 100 }, signal)
      for (const item of applications.items) {
        if (item.status === 'PENDING' && item.storeId) pending.add(item.storeId)
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
        <p class="hint">门店由运营代为开通。</p>
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
      <ul class="store-cards">
        <li v-for="row in result.items" :key="row.id" class="merchant-store-card">
          <img v-if="row.coverUrl" class="thumb" :src="row.coverUrl" :alt="row.name || '门店'" />
          <div v-else class="thumb-fallback">暂无图片</div>
          <div>
            <h2>{{ row.name || '未命名门店' }}</h2>
            <div class="meta">
              <span>地区 {{ row.regionId ?? '—' }}</span>
              <span>{{ priceLabel(row.priceText, row.priceFrom) || '价格待补充' }}</span>
              <el-tag :type="row.shelfStatus === 'ON_SHELF' || row.shelfStatus === 'PUBLISHED' ? 'success' : 'info'" round>
                {{ shelfStatusLabel(row.shelfStatus) }}
              </el-tag>
              <el-tag v-if="pendingIds.has(row.id)" type="warning" round>待审</el-tag>
            </div>
          </div>
          <div class="actions">
            <RouterLink :to="`/stores/${row.id}`">进入编辑</RouterLink>
            <RouterLink :to="`/stores/${row.id}/shelf`">上下架</RouterLink>
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
