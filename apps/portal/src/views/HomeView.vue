<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Article, HomestayCard, Region } from '@nongjiale/shared'
import * as api from '../api'
import HomestayCardItem from '../components/HomestayCardItem.vue'
import { useConfigStore } from '../stores/config'

const router = useRouter()
const config = useConfigStore()
const regions = ref<Region[]>([])
const hot = ref<HomestayCard[]>([])
const articles = ref<Article[]>([])
const keyword = ref('')
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const feed = await api.fetchHomeFeed()
    regions.value = Array.isArray(feed?.regions) ? feed.regions : []
    hot.value = Array.isArray(feed?.hotHomestays) ? feed.hotHomestays : []
    articles.value = Array.isArray(feed?.articles) ? feed.articles : []
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function search() {
  const q = keyword.value.trim()
  router.push({ path: '/search', query: q ? { q } : {} })
}

onMounted(load)
</script>

<template>
  <section>
    <div class="hero">
      <h1>{{ config.siteName }}</h1>
      <p>登录后提交预订意向。客服确认档期，意向不等于已锁房，也不能在线支付。</p>
      <form class="hero-search" @submit.prevent="search">
        <input v-model="keyword" aria-label="搜索关键词" placeholder="搜农家乐、地名" />
        <button class="btn" type="submit">搜索</button>
      </form>
    </div>

    <p v-if="loading" class="muted">加载中…</p>
    <p v-else-if="error" class="error">
      {{ error }}
      <button class="btn secondary" type="button" @click="load">重试</button>
    </p>

    <template v-else>
      <h2 class="page-title">热门地区</h2>
      <div class="chips">
        <router-link v-for="r in regions" :key="r.id" class="chip" :to="`/regions/${r.slug}`">{{ r.name }}</router-link>
      </div>
      <p v-if="!regions.length" class="muted">暂无地区</p>

      <h2 class="page-title">热门农家乐</h2>
      <div class="grid">
        <HomestayCardItem v-for="h in hot" :key="h.id" :item="h" />
      </div>
      <p v-if="!hot.length" class="muted">暂无推荐</p>

      <h2 class="page-title">攻略 / 资讯</h2>
      <div class="list">
        <router-link v-for="article in articles.slice(0, 5)" :key="article.id" class="card" :to="`/articles/${article.id}`">
          <strong>{{ article.title }}</strong>
          <p v-if="article.summary" class="muted">{{ article.summary }}</p>
        </router-link>
      </div>
      <p v-if="!articles.length" class="muted">暂无攻略</p>
      <router-link class="btn secondary" to="/articles">更多攻略</router-link>

      <div class="card trust">
        <strong>人工确认档期</strong>
        <p class="muted">提交的是预订意向。客服电话确认后才安排入住，页面没有收银台。</p>
        <p v-if="config.contactPhone">
          客服电话 <a :href="`tel:${config.contactPhone}`">{{ config.contactPhone }}</a>
        </p>
      </div>
    </template>
  </section>
</template>
