<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchMyIntents } from '../api/portal'
import { readRouteQueryValue } from '../api/query'
import type { IntentRecord } from '../api/readers'
import EmptyState from '../components/EmptyState.vue'
import IntentNoticeBanner from '../components/IntentNoticeBanner.vue'
import Pager from '../components/Pager.vue'
import StatusTag from '../components/StatusTag.vue'
import { INTENT_LIST_NOTICE } from '../domain/copy'
import { useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const { loading, error, run } = useLoadState()
const result = ref<PageResult<IntentRecord> | null>(null)
const page = computed(() => Number(readRouteQueryValue(route.query.page) || '1') || 1)

async function load() {
  const outcome = await run((signal) => fetchMyIntents(page.value, signal))
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') result.value = null
}

function changePage(next: number) {
  void router.push(next <= 1 ? '/my/intents' : { path: '/my/intents', query: { page: String(next) } })
}

watch(page, () => void load(), { immediate: true })
</script>

<template>
  <section class="stack">
    <div class="page-head">
      <h1>我的意向</h1>
    </div>
    <IntentNoticeBanner :text="INTENT_LIST_NOTICE" />
    <div v-if="loading" class="card-grid" aria-busy="true">
      <div v-for="item in 3" :key="item" class="skeleton-card"></div>
    </div>
    <EmptyState v-else-if="error" :title="error">
      <button class="btn btn-secondary" type="button" @click="load">重试</button>
    </EmptyState>
    <EmptyState v-else-if="!result?.items.length" title="还没有意向。去发现农家乐" action="去发现农家乐" to="/listings" />
    <template v-else>
      <div class="stack">
        <RouterLink v-for="intent in result.items" :key="intent.id" class="panel intent-row" :to="`/my/intents/${intent.id}`">
          <strong class="mono">{{ intent.intentNo || intent.id }}</strong>
          <span>{{ intent.storeName || '房源' }}</span>
          <span class="muted">{{ intent.checkIn }}<template v-if="intent.checkOut"> 至 {{ intent.checkOut }}</template></span>
          <StatusTag :status="intent.status" />
        </RouterLink>
      </div>
      <Pager :page="result.page || page" :page-size="result.pageSize" :total="result.total" @change="changePage" />
    </template>
  </section>
</template>
