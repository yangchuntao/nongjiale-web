<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { HomestayDetail } from '@nongjiale/shared'
import * as api from '../api'
import { ApiError } from '../utils/http'

const route = useRoute()
const detail = ref<HomestayDetail | null>(null)
const error = ref('')
const offShelf = ref(false)
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  offShelf.value = false
  detail.value = null
  try {
    detail.value = await api.fetchHomestay(route.params.id as string)
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 410) {
      offShelf.value = true
      error.value = e.message || '该农家乐暂不可预订'
    } else {
      error.value = e instanceof Error ? e.message : '加载失败'
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <section>
    <p v-if="loading" class="muted">加载中…</p>
    <div v-else-if="offShelf" class="card">
      <h1>已下架</h1>
      <p class="error">{{ error }}</p>
      <router-link class="btn secondary" to="/search">返回列表</router-link>
    </div>
    <p v-else-if="error" class="error">{{ error }}</p>
    <template v-else-if="detail">
      <div class="card">
        <h1 class="page-title">{{ detail.name }}</h1>
        <p class="muted">{{ detail.address }}</p>
        <p>
          <span class="price">¥{{ detail.priceFrom }}</span>
          <span class="muted"> 起 · 销量 {{ detail.salesCount }}</span>
        </p>
        <p v-if="detail.facilities"><strong>设施：</strong>{{ detail.facilities }}</p>
        <p v-if="detail.notice"><strong>须知：</strong>{{ detail.notice }}</p>

        <h3>房型</h3>
        <ul>
          <li v-for="r in detail.rooms" :key="r.id">
            {{ r.name }} · {{ r.roomCount }} 间 · ¥{{ r.priceFrom }} 起
          </li>
        </ul>

        <div class="actions" v-if="detail.bookable">
          <router-link class="btn" :to="`/homestays/${detail.id}/book`">提交预订意向</router-link>
          <router-link class="btn secondary" :to="`/homestays/${detail.id}/contact`">咨询留言</router-link>
        </div>
      </div>
    </template>
  </section>
</template>
