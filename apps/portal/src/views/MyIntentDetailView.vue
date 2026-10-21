<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchMyIntent } from '../api/portal'
import type { IntentRecord } from '../api/readers'
import IntentNoticeBanner from '../components/IntentNoticeBanner.vue'
import StatusTag from '../components/StatusTag.vue'
import { INTENT_NOTICE } from '../domain/copy'
import { useSiteStore } from '../stores/site'
import { useLoadState } from '../utils/load'

const route = useRoute()
const site = useSiteStore()
const { loading, error, errorKind, run } = useLoadState()
const intent = ref<IntentRecord | null>(null)
const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))

async function load() {
  intent.value = null
  if (!id.value) return
  const outcome = await run((signal) => fetchMyIntent(id.value, signal))
  if (outcome.status === 'ok') intent.value = outcome.data
}

watch(id, () => void load(), { immediate: true })
</script>

<template>
  <section class="stack detail">
    <nav class="crumbs" aria-label="位置">
      <RouterLink to="/">首页</RouterLink>
      <span aria-hidden="true">/</span>
      <RouterLink to="/my/intents">我的意向</RouterLink>
      <span aria-hidden="true">/</span>
      <span class="now">{{ intent?.intentNo || intent?.id || '详情' }}</span>
    </nav>
    <div v-if="loading" class="skeleton-card" aria-busy="true"></div>
    <div v-else-if="errorKind === 'notFound'" class="empty-state">
      <p>不存在或无权查看</p>
      <RouterLink class="btn btn-secondary" to="/my/intents">返回我的意向</RouterLink>
    </div>
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" type="button" @click="load">重试</button>
    </div>
    <article v-else-if="intent" class="panel stack">
      <div class="page-head">
        <h1 class="mono">{{ intent.intentNo || intent.id }}</h1>
        <StatusTag :status="intent.status" />
      </div>
      <IntentNoticeBanner :text="INTENT_NOTICE" />
      <dl class="facts">
        <dt>房源</dt>
        <dd>
          <RouterLink v-if="intent.storeId" :to="`/listings/${intent.storeId}`">{{ intent.storeName || '查看房源' }}</RouterLink>
          <template v-else>{{ intent.storeName || '—' }}</template>
        </dd>
        <dt>日期</dt>
        <dd>{{ intent.checkIn || '—' }}<template v-if="intent.checkOut"> 至 {{ intent.checkOut }}</template></dd>
        <dt>晚数</dt>
        <dd>{{ intent.nights ?? '—' }}</dd>
        <dt>人数</dt>
        <dd>{{ intent.guests ?? '—' }}</dd>
        <dt>联系人</dt>
        <dd>{{ intent.contactName || '—' }}</dd>
        <dt>手机</dt>
        <dd>{{ intent.contactPhone || '—' }}</dd>
        <dt>备注</dt>
        <dd>{{ intent.userRemark || '—' }}</dd>
        <dt>创建时间</dt>
        <dd>{{ intent.createdAt || '—' }}</dd>
      </dl>
      <a class="btn btn-secondary" :href="`tel:${site.phone.replace(/\s+/g, '')}`">拨打客服 {{ site.phone }}</a>
    </article>
  </section>
</template>
