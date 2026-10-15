<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Article } from '@nongjiale/shared'
import * as api from '../api'
import { ApiError } from '../utils/http'

const route = useRoute()
const article = ref<Article | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  article.value = null
  try {
    article.value = await api.fetchArticle(route.params.id as string)
  } catch (e) {
    error.value = e instanceof ApiError && e.httpStatus === 404
      ? '内容不存在'
      : (e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <section>
    <router-link to="/articles">返回攻略</router-link>
    <p v-if="loading" class="muted">加载中…</p>
    <div v-else-if="error" class="card">
      <p class="error">{{ error }}</p>
      <button class="btn secondary" type="button" @click="load">重试</button>
    </div>
    <article v-else-if="article" class="card">
      <h1 class="page-title">{{ article.title }}</h1>
      <p v-if="article.publishedAt" class="muted">{{ article.publishedAt }}</p>
      <img v-if="article.coverUrl" :src="article.coverUrl" :alt="article.title" style="max-width:100%;border-radius:8px" />
      <p v-if="article.summary"><strong>{{ article.summary }}</strong></p>
      <div class="prose">{{ article.body || '暂无正文' }}</div>
    </article>
  </section>
</template>
