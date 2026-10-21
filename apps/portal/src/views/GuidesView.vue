<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchArticles } from '../api/portal'
import { readRouteQueryValue } from '../api/query'
import type { ArticleSummary } from '../api/readers'
import EmptyState from '../components/EmptyState.vue'
import Pager from '../components/Pager.vue'
import { useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const { loading, error, run } = useLoadState()
const result = ref<PageResult<ArticleSummary> | null>(null)
const page = computed(() => Number(readRouteQueryValue(route.query.page) || '1') || 1)

async function load() {
  const outcome = await run((signal) => fetchArticles(page.value, signal))
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') result.value = null
}

function changePage(next: number) {
  void router.push(next <= 1 ? '/guides' : { path: '/guides', query: { page: String(next) } })
}

watch(page, () => void load(), { immediate: true })
</script>

<template>
  <section class="stack">
    <header class="list-head">
      <nav class="crumbs" aria-label="位置">
        <RouterLink to="/">首页</RouterLink>
        <span aria-hidden="true">/</span>
        <span class="now">攻略</span>
      </nav>
      <h1>水乡攻略</h1>
      <p class="desc">看看别人怎么安排苏中周末。</p>
    </header>
    <div v-if="loading" class="card-grid" aria-busy="true">
      <div v-for="item in 3" :key="item" class="skeleton-card"></div>
    </div>
    <EmptyState v-else-if="error" :title="error">
      <button class="btn btn-secondary" type="button" @click="load">重试</button>
    </EmptyState>
    <EmptyState v-else-if="!result?.items.length" title="暂无攻略" action="回首页" to="/" />
    <template v-else>
      <div class="card-grid">
        <RouterLink v-for="article in result.items" :key="article.id" class="article-card" :to="`/guides/${article.id}`">
          <img v-if="article.coverUrl" class="cover" :src="article.coverUrl" :alt="article.title" />
          <div v-else class="cover-fallback article-cover" aria-hidden="true"></div>
          <div class="body">
            <h2 class="card-title">{{ article.title }}</h2>
            <p class="muted">{{ article.summary }}</p>
            <span class="text-link">查看攻略 →</span>
          </div>
        </RouterLink>
      </div>
      <Pager :page="result.page || page" :page-size="result.pageSize" :total="result.total" @change="changePage" />
    </template>
  </section>
</template>
