<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchStore } from '../api/portal'
import { LISTING_UNAVAILABLE } from '../api/errors'
import { canSubmitIntent, priceLabel, storeTestLabel, type StoreDetail } from '../api/readers'
import IntentNoticeBanner from '../components/IntentNoticeBanner.vue'
import { INTENT_NOTICE } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'
import { useLoadState } from '../utils/load'

const route = useRoute()
const auth = useAuthStore()
const site = useSiteStore()
const { loading, error, errorKind, run } = useLoadState()
const store = ref<StoreDetail | null>(null)

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const images = computed(() => {
  const current = store.value
  if (!current) return []
  const gallery = [...current.gallery]
  if (current.coverUrl && !gallery.includes(current.coverUrl)) gallery.unshift(current.coverUrl)
  return gallery
})
const bookable = computed(() => (store.value ? canSubmitIntent(store.value.shelfStatus) : false))
const intentTo = computed(() => `/listings/${id.value}/intent`)
const phone = computed(() => store.value?.phone || site.phone)

async function load() {
  store.value = null
  if (!id.value) return
  const outcome = await run((signal) => fetchStore(id.value, signal))
  if (outcome.status === 'ok') store.value = outcome.data
}

watch(id, () => void load(), { immediate: true })

function packageName(item: StoreDetail['packages'][number]): string {
  return item.name || item.title || '套餐'
}
</script>

<template>
  <section class="detail-layout" :class="{ 'detail-pad': bookable || store }">
    <div v-if="loading" class="skeleton-card" aria-busy="true"></div>
    <div v-else-if="errorKind === 'gone'" class="empty-state">
      <p>{{ LISTING_UNAVAILABLE }}</p>
      <p v-if="error && error !== LISTING_UNAVAILABLE">{{ error }}</p>
      <p>该房源暂不可提交意向</p>
      <RouterLink class="btn btn-secondary" to="/listings">返回列表</RouterLink>
    </div>
    <div v-else-if="errorKind === 'notFound'" class="empty-state">
      <p>{{ error || '房源不存在' }}</p>
      <RouterLink class="btn btn-secondary" to="/listings">返回列表</RouterLink>
    </div>
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" type="button" @click="load">加载失败，点击重试</button>
    </div>
    <template v-else-if="store">
      <div v-if="images.length" class="gallery">
        <img v-for="(image, index) in images" :key="`${image}-${index}`" class="cover" :src="image" :alt="store.name" />
      </div>
      <div v-else class="cover-fallback">暂无图片</div>
      <div class="page-head">
        <h1>{{ store.name }}</h1>
        <p class="lede">{{ store.regionName }} {{ store.address }}</p>
        <p v-if="priceLabel(store.priceText, store.priceFrom)">{{ priceLabel(store.priceText, store.priceFrom) }}</p>
        <div class="tag-row">
          <span v-if="storeTestLabel(store)" class="tag">{{ storeTestLabel(store) }}</span>
          <span v-if="store.homeRecommended" class="tag tag-info">首页推荐</span>
          <span v-if="store.homeSort !== null" class="tag">排序 {{ store.homeSort }}</span>
          <span v-if="store.shelfStatus" class="tag">{{ store.shelfStatus === 'ON_SHELF' ? '上架' : '未上架' }}</span>
        </div>
      </div>
      <IntentNoticeBanner :text="INTENT_NOTICE" collapsible />
      <section v-if="store.packageText">
        <h2>套餐</h2>
        <p class="body-large">{{ store.packageText }}</p>
      </section>
      <section v-if="store.packages.length">
        <h2>套餐明细</h2>
        <p class="muted">明细只作辅助，展示与预订说明以套餐文案为准。</p>
        <ul>
          <li v-for="(item, index) in store.packages" :key="item.id ?? index">
            {{ packageName(item) }}
            <span v-if="item.priceText || item.price"> · {{ item.priceText || item.price }}</span>
            <span v-if="item.description || item.content"> · {{ item.description || item.content }}</span>
          </li>
        </ul>
      </section>
      <p v-else-if="!store.packageText" class="muted">暂无套餐文案</p>
      <section v-if="store.features"><h2>特色</h2><p class="prose">{{ store.features }}</p></section>
      <section v-if="store.facilities"><h2>设施</h2><p class="prose">{{ store.facilities }}</p></section>
      <section v-if="store.notice"><h2>须知</h2><p class="prose">{{ store.notice }}</p></section>
      <section v-if="store.trafficText"><h2>交通与周边</h2><p class="prose">{{ store.trafficText }}</p></section>
      <div class="detail-cta detail-cta-fixed">
        <RouterLink v-if="bookable && auth.isAuthenticated" class="btn btn-primary btn-lg" :to="intentTo">
          提交意向
        </RouterLink>
        <RouterLink
          v-else-if="bookable"
          class="btn btn-primary btn-lg"
          :to="{ path: '/login', query: { redirect: intentTo } }"
        >
          提交意向
        </RouterLink>
        <button v-else class="btn btn-primary btn-lg" type="button" disabled>{{ LISTING_UNAVAILABLE }}</button>
        <a class="btn btn-secondary btn-lg" :href="`tel:${phone.replace(/\s+/g, '')}`">拨打电话</a>
        <p v-if="bookable" class="muted">提交意向 · 客服将联系确认 · 意向不等于已锁房</p>
        <p v-else class="muted">该房源暂不可提交意向</p>
      </div>
    </template>
  </section>
</template>
