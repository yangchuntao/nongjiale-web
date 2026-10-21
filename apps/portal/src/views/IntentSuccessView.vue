<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchMyIntent } from '../api/portal'
import type { IntentRecord } from '../api/readers'
import IntentNoticeBanner from '../components/IntentNoticeBanner.vue'
import { intentSuccessCopy } from '../domain/copy'
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
  <section class="stack">
    <div v-if="loading" class="skeleton-card" aria-busy="true"></div>
    <div v-else-if="errorKind === 'notFound'" class="empty-state">
      <p>不存在或无权查看</p>
      <RouterLink class="btn btn-secondary" to="/my/intents">返回我的意向</RouterLink>
    </div>
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" type="button" @click="load">请刷新重试</button>
    </div>
    <div v-else-if="intent" class="panel stack">
      <h1>意向已提交</h1>
      <p class="body-large">{{ intentSuccessCopy(intent.intentNo || String(intent.id), site.phone) }}</p>
      <IntentNoticeBanner text="意向不等于已锁房，请勿理解为已订成或已支付。" />
      <dl class="facts">
        <dt>单号</dt>
        <dd class="mono">{{ intent.intentNo || intent.id }}</dd>
        <dt>房源</dt>
        <dd>{{ intent.storeName || '—' }}</dd>
        <dt>日期</dt>
        <dd>{{ intent.checkIn || '—' }}<template v-if="intent.checkOut"> 至 {{ intent.checkOut }}</template></dd>
      </dl>
      <div class="detail-cta-actions">
        <RouterLink class="btn btn-primary" to="/my/intents">查看我的意向</RouterLink>
        <RouterLink class="btn btn-secondary" to="/">返回首页</RouterLink>
        <a class="btn btn-ghost" :href="`tel:${site.phone.replace(/\s+/g, '')}`">拨打客服</a>
      </div>
    </div>
  </section>
</template>
