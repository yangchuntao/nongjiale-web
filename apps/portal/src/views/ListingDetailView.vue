<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchStore } from '../api/portal'
import { LISTING_UNAVAILABLE } from '../api/errors'
import { canSubmitIntent, portalVisitorTags, priceLabel, type StoreDetail } from '../api/readers'
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
const activeImage = ref(0)

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const images = computed(() => {
  const current = store.value
  if (!current) return []
  const gallery = [...current.gallery]
  if (current.coverUrl && !gallery.includes(current.coverUrl)) gallery.unshift(current.coverUrl)
  return gallery
})
const bookable = computed(() => (store.value ? canSubmitIntent(store.value.shelfStatus) : false))
const visitorTags = computed(() => (store.value ? portalVisitorTags(store.value) : []))
const shownPrice = computed(() => (store.value ? priceLabel(store.value.priceText, store.value.priceFrom) : ''))
const intentTo = computed(() => `/listings/${id.value}/intent`)
const phone = computed(() => store.value?.phone || site.phone)

async function load() {
  store.value = null
  if (!id.value) return
  const outcome = await run((signal) => fetchStore(id.value, signal))
  if (outcome.status === 'ok') store.value = outcome.data
}

watch(id, () => void load(), { immediate: true })
watch(images, () => {
  activeImage.value = 0
})

function packageName(item: StoreDetail['packages'][number]): string {
  return item.name || item.title || '套餐'
}
</script>

<template>
  <div class="detail">
    <nav class="crumbs" aria-label="位置">
      <RouterLink to="/">首页</RouterLink>
      <span aria-hidden="true">/</span>
      <RouterLink to="/listings">找农家乐</RouterLink>
      <span aria-hidden="true">/</span>
      <span class="now">{{ store?.name || '详情' }}</span>
    </nav>
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
    <section v-else-if="store" class="detail-layout">
      <div class="detail-intro">
        <div v-if="images.length" class="gallery-block">
          <img class="gallery-main" :src="images[activeImage]" :alt="store.name" />
          <div v-if="images.length > 1" class="thumbs">
            <button
              v-for="(image, index) in images"
              :key="`${image}-${index}`"
              type="button"
              :class="{ active: index === activeImage }"
              @click="activeImage = index"
            >
              <img :src="image" alt="" />
            </button>
          </div>
        </div>
        <div v-else class="detail-fallback">暂无图片</div>
        <div class="detail-title-block">
          <h1 class="detail-title">{{ store.name }}</h1>
          <p class="detail__sub">
            <span>{{ store.regionName }} {{ store.address }}</span>
            <a v-if="store.phone" class="tel" :href="`tel:${store.phone.replace(/\s+/g, '')}`">{{ store.phone }}</a>
          </p>
          <div v-if="visitorTags.length" class="detail__tags">
            <span v-for="tag in visitorTags" :key="tag" class="tag tag-brand">{{ tag }}</span>
          </div>
        </div>
      </div>
      <aside class="detail-cta">
        <div class="detail-cta-price">
          <p v-if="shownPrice" class="price">{{ shownPrice }}</p>
          <span v-else class="stay__hint">价格联系客服确认</span>
        </div>
        <div class="detail-cta-actions">
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
          <button v-else class="btn btn-primary btn-lg" type="button" disabled>提交意向</button>
          <a class="btn btn-ghost btn-lg" :href="`tel:${phone.replace(/\s+/g, '')}`">拨打电话</a>
        </div>
        <p v-if="bookable" class="caption">{{ INTENT_NOTICE }}</p>
        <p v-else class="warn-inline">该房源暂不可提交意向</p>
      </aside>
      <div class="detail-body">
        <IntentNoticeBanner :text="INTENT_NOTICE" collapsible start-collapsed />
        <section v-if="store.packageText" class="detail-section">
          <h3>套餐</h3>
          <p class="body-large">{{ store.packageText }}</p>
        </section>
        <section v-if="store.packages.length" class="detail-section">
          <h3>套餐明细</h3>
          <p class="muted">明细只作辅助，展示与预订说明以套餐文案为准。</p>
          <ul>
            <li v-for="(item, index) in store.packages" :key="item.id ?? index">
              {{ packageName(item) }}
              <span v-if="item.priceText || item.price"> · {{ item.priceText || item.price }}</span>
              <span v-if="item.description || item.content"> · {{ item.description || item.content }}</span>
            </li>
          </ul>
        </section>
        <section v-else-if="!store.packageText" class="detail-section">
          <h3>套餐</h3>
          <p class="muted">暂无套餐文案</p>
        </section>
        <section v-if="store.features" class="detail-section"><h3>特色</h3><p class="prose">{{ store.features }}</p></section>
        <section v-if="store.facilities" class="detail-section"><h3>设施</h3><p class="prose">{{ store.facilities }}</p></section>
        <section v-if="store.notice" class="detail-section"><h3>须知</h3><p class="prose">{{ store.notice }}</p></section>
        <section v-if="store.trafficText" class="detail-section"><h3>交通与周边</h3><p class="prose">{{ store.trafficText }}</p></section>
      </div>
    </section>
  </div>
</template>
