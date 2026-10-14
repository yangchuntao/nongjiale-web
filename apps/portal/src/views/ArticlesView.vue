<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Article } from '@nongjiale/shared'
import * as api from '../api'

const items = ref<Article[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.fetchArticles(page.value, pageSize)
    items.value = Array.isArray(data?.items) ? data.items : []
    total.value = typeof data?.total === 'number' ? data.total : items.value.length
  } catch (e) {
    items.value = []
    total.value = 0
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function changePage(next: number) {
  page.value = next
  load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="page-title">攻略 / 资讯</h1>
    <p v-if="loading" class="muted">加载中…</p>
    <p v-else-if="error" class="error">
      {{ error }}
      <button class="btn secondary" type="button" @click="load">重试</button>
    </p>
    <template v-else>
      <div class="list">
        <router-link v-for="item in items" :key="item.id" class="card" :to="`/articles/${item.id}`">
          <strong>{{ item.title }}</strong>
          <p v-if="item.summary" class="muted">{{ item.summary }}</p>
          <p v-if="item.publishedAt" class="muted">{{ item.publishedAt }}</p>
        </router-link>
      </div>
      <p v-if="!items.length" class="muted">暂无已发布内容</p>
      <div v-if="total > pageSize" class="actions">
        <button class="btn secondary" type="button" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <button class="btn secondary" type="button" :disabled="page * pageSize >= total" @click="changePage(page + 1)">下一页</button>
      </div>
    </template>
  </section>
</template>
