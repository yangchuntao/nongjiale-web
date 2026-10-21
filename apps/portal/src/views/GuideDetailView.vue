<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchArticle } from '../api/portal'
import type { ArticleDetail } from '../api/readers'
import { useLoadState } from '../utils/load'

const route = useRoute()
const { loading, error, errorKind, run } = useLoadState()
const article = ref<ArticleDetail | null>(null)
const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))

async function load() {
  article.value = null
  if (!id.value) return
  const outcome = await run((signal) => fetchArticle(id.value, signal))
  if (outcome.status === 'ok') article.value = outcome.data
}

watch(id, () => void load(), { immediate: true })
</script>

<template>
  <article class="stack detail">
    <nav class="crumbs" aria-label="位置">
      <RouterLink to="/">首页</RouterLink>
      <span aria-hidden="true">/</span>
      <RouterLink to="/guides">攻略</RouterLink>
      <span aria-hidden="true">/</span>
      <span class="now">{{ article?.title || '正文' }}</span>
    </nav>
    <div v-if="loading" class="skeleton-card" aria-busy="true"></div>
    <div v-else-if="errorKind === 'notFound'" class="empty-state">
      <p>攻略不存在或未发布</p>
      <RouterLink class="btn btn-secondary" to="/guides">返回攻略</RouterLink>
    </div>
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" type="button" @click="load">重试</button>
    </div>
    <template v-else-if="article">
      <h1 class="detail-title">{{ article.title }}</h1>
      <img v-if="article.coverUrl" class="gallery-main" :src="article.coverUrl" :alt="article.title" />
      <p v-if="article.summary" class="lede">{{ article.summary }}</p>
      <div class="detail-section">
        <div class="prose">{{ article.content || '暂无正文' }}</div>
      </div>
      <RouterLink class="btn btn-secondary" to="/guides">← 返回攻略</RouterLink>
    </template>
  </article>
</template>
