<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { INTENT_STATUS_LABEL, labelOf, type MyIntent } from '@nongjiale/shared'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const items = ref<MyIntent[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.fetchMyIntents(auth.token!, page.value, pageSize)
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
    <h1 class="page-title">我的意向</h1>
    <p class="muted">只读查看，不能自助取消，也没有支付入口。</p>
    <p v-if="loading" class="muted">加载中…</p>
    <p v-else-if="error" class="error">
      {{ error }}
      <button class="btn secondary" type="button" @click="load">重试</button>
    </p>
    <template v-else>
      <div class="list">
        <router-link v-for="item in items" :key="item.id" class="card" :to="`/me/intents/${item.id}`">
          <div class="row-between">
            <strong>{{ item.intentNo || item.id }}</strong>
            <span>{{ labelOf(INTENT_STATUS_LABEL, item.status) }}</span>
          </div>
          <p>{{ item.homestayName || `房源 ${item.homestayId}` }}</p>
          <p class="muted">到店 {{ item.checkIn }} · {{ item.guests }} 人 · {{ item.createdAt }}</p>
        </router-link>
      </div>
      <p v-if="!items.length" class="muted">暂无意向单，去首页看看农家乐</p>
      <router-link v-if="!items.length" class="btn" to="/">去首页</router-link>
      <div v-if="total > pageSize" class="actions">
        <button class="btn secondary" type="button" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <button class="btn secondary" type="button" :disabled="page * pageSize >= total" @click="changePage(page + 1)">下一页</button>
      </div>
    </template>
  </section>
</template>
