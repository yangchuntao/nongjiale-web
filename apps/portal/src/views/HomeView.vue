<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { fetchHomeBanners, fetchHomeFeed, fetchRegions } from '../api/portal'
import type { ArticleSummary, RegionItem, StoreCard } from '../api/readers'
import HomeBanner from '../components/HomeBanner.vue'
import StoreCardView from '../components/StoreCard.vue'
import { visibleHomeBanners, type HomeBanner as HomeBannerItem } from '../domain/banners'
import EmptyState from '../components/EmptyState.vue'
import { DESTINATION_PENDING, welcomeTitle } from '../domain/copy'
import { destinationRegions } from '../domain/filters'
import { useSiteStore } from '../stores/site'
import { useLoadState } from '../utils/load'

const site = useSiteStore()
const router = useRouter()
const featureText = ref('')
const stores = ref<StoreCard[]>([])
const articles = ref<ArticleSummary[]>([])
const regions = ref<RegionItem[]>([])
const banners = ref<HomeBannerItem[]>([])
const regionError = ref('')
const destinations = computed(() => destinationRegions(regions.value))
const { loading, error, run } = useLoadState()

async function loadFeed() {
  const outcome = await run((signal) => fetchHomeFeed(signal))
  if (outcome.status === 'ok') {
    stores.value = outcome.data.stores
    articles.value = outcome.data.articles.slice(0, 4)
  }
}

async function loadBanners() {
  try {
    banners.value = visibleHomeBanners(await fetchHomeBanners())
  } catch {
    banners.value = []
  }
}

async function loadRegions() {
  regionError.value = ''
  try {
    regions.value = await fetchRegions()
  } catch {
    regions.value = []
    regionError.value = '目的地加载失败，点击重试'
  }
}

function search() {
  const tag = featureText.value.trim()
  void router.push(tag ? { path: '/listings', query: { tag } } : { path: '/listings' })
}

onMounted(() => {
  void loadFeed()
  void loadRegions()
  void loadBanners()
})
</script>

<template>
  <div class="home">
    <!-- Banner 剧场：0 条不渲染，1 条静帧，≥2 条轮播（规则在 domain/banners） -->
    <HomeBanner v-if="banners.length" :banners="banners" />
    <header v-else class="hero--none">
      <h1>{{ welcomeTitle(site.name) }}</h1>
      <p class="lede">挑选苏中农家乐，提交意向后由客服联系确认档期。</p>
    </header>

    <!-- 悬浮搜索：压在剧场下缘 -->
    <div class="find">
      <form class="find__card" @submit.prevent="search">
        <label class="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" stroke-linecap="round" />
          </svg>
          <input v-model="featureText" name="tag" type="search" placeholder="搜特色，比如「带院子」「能钓鱼」" aria-label="搜索特色" />
        </label>
        <button class="btn btn-primary" type="submit">找农家乐</button>
      </form>
    </div>

    <div class="dest">
      <span class="dest__label">去哪儿</span>
      <p v-if="regionError">
        <button class="btn btn-ghost btn-sm" type="button" @click="loadRegions">{{ regionError }}</button>
      </p>
      <div v-else-if="!destinations.length" class="empty-inline">
        <p>{{ DESTINATION_PENDING }}</p>
        <RouterLink class="btn btn-ghost btn-sm" to="/listings">找农家乐</RouterLink>
      </div>
      <template v-else>
        <RouterLink
          v-for="region in destinations"
          :key="region.id"
          class="chip"
          :to="{ path: '/listings', query: { regionId: String(region.id) } }"
        >
          {{ region.name }}
        </RouterLink>
      </template>
    </div>

    <section class="floor" :aria-busy="loading">
      <div class="floor__head">
        <h2>推荐<em>农家乐</em> <span class="sub">客服确认档期，先看院子再谈</span></h2>
        <RouterLink class="text-link" to="/listings">查看全部 →</RouterLink>
      </div>
      <div v-if="loading" class="stays">
        <div v-for="item in 3" :key="item" class="skeleton-card"></div>
      </div>
      <EmptyState v-else-if="error" :title="error">
        <button class="btn btn-secondary" type="button" @click="loadFeed">加载失败，点击重试</button>
      </EmptyState>
      <EmptyState
        v-else-if="!stores.length"
        title="暂无推荐，去看看全部农家乐"
        action="查看全部"
        to="/listings"
      />
      <div v-else class="stays">
        <StoreCardView v-for="store in stores" :key="store.id" :store="store" />
      </div>
    </section>

    <section class="floor">
      <div class="floor__head">
        <h2>走走<em>看看</em> <span class="sub">村里的事，慢慢讲</span></h2>
        <RouterLink class="text-link" to="/guides">更多攻略 →</RouterLink>
      </div>
      <div v-if="articles.length" class="card-grid">
        <RouterLink v-for="article in articles" :key="article.id" class="article-card" :to="`/guides/${article.id}`">
          <img v-if="article.coverUrl" class="cover" :src="article.coverUrl" :alt="article.title" />
          <div v-else class="cover-fallback article-cover" aria-hidden="true"></div>
          <div class="body">
            <h3 class="card-title">{{ article.title }}</h3>
            <p class="muted">{{ article.summary }}</p>
            <span class="text-link">查看攻略</span>
          </div>
        </RouterLink>
      </div>
      <p v-else-if="!loading && !error" class="muted">暂无攻略</p>
    </section>
  </div>
</template>
