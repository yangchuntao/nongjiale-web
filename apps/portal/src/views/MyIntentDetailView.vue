<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { INTENT_STATUS_LABEL, labelOf, type MyIntentDetail } from '@nongjiale/shared'
import * as api from '../api'
import { ApiError } from '../utils/http'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()
const item = ref<MyIntentDetail | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  item.value = null
  try {
    item.value = await api.fetchMyIntent(auth.token!, route.params.id as string)
  } catch (e) {
    error.value = e instanceof ApiError && e.httpStatus === 404
      ? '意向单不存在'
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
    <router-link to="/me/intents">返回我的意向</router-link>
    <h1 class="page-title">意向详情</h1>
    <p v-if="loading" class="muted">加载中…</p>
    <p v-else-if="error" class="error">
      {{ error }}
      <button class="btn secondary" type="button" @click="load">重试</button>
    </p>
    <div v-else-if="item" class="card">
      <p><strong>单号：</strong>{{ item.intentNo }}</p>
      <p><strong>房源：</strong>{{ item.homestayName || item.homestayId }}</p>
      <p><strong>到店 / 离店：</strong>{{ item.checkIn }} / {{ item.checkOut }}</p>
      <p><strong>人数：</strong>{{ item.guests }}</p>
      <p><strong>状态：</strong>{{ labelOf(INTENT_STATUS_LABEL, item.status) }}</p>
      <p><strong>联系人：</strong>{{ item.contactName || '—' }}</p>
      <p><strong>手机：</strong>{{ item.contactPhone || '—' }}</p>
      <p v-if="item.travelMode"><strong>出行方式：</strong>{{ item.travelMode }}</p>
      <p v-if="item.createdAt" class="muted">提交于 {{ item.createdAt }}</p>
      <p class="muted">此单只读，不能取消，也不能在线支付。档期由客服确认。</p>
      <router-link v-if="item.homestayId" :to="`/homestays/${item.homestayId}`">查看房源</router-link>
    </div>
  </section>
</template>
