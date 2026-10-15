<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { INTENT_STATUS_LABEL, labelOf, type MerchantIntent } from '@nongjiale/shared'
import * as api from '../api'
import { ApiError } from '../utils/http'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const intent = ref<MerchantIntent | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  intent.value = null
  try {
    intent.value = await api.fetchIntent(auth.token!, route.params.id as string)
  } catch (e) {
    error.value = e instanceof ApiError && e.httpStatus === 404
      ? '意向单不存在或不属于当前商家'
      : (e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div v-loading="loading">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2>意向详情 <el-tag type="info">只读</el-tag></h2>
      <el-button @click="router.push('/intents')">返回列表</el-button>
    </div>
    <el-alert v-if="error" :title="error" type="error" show-icon>
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-descriptions v-else-if="intent" :column="1" border>
      <el-descriptions-item label="单号">{{ intent.intentNo }}</el-descriptions-item>
      <el-descriptions-item label="门店">{{ intent.storeName || intent.storeId }}</el-descriptions-item>
      <el-descriptions-item label="到店">{{ intent.checkIn }}</el-descriptions-item>
      <el-descriptions-item label="离店">{{ intent.checkOut }}</el-descriptions-item>
      <el-descriptions-item label="人数">{{ intent.guests }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ labelOf(INTENT_STATUS_LABEL, intent.status) }}</el-descriptions-item>
      <el-descriptions-item label="联系人">{{ intent.contactName || '—' }}</el-descriptions-item>
      <el-descriptions-item label="手机">{{ intent.contactPhoneMasked || '—' }}</el-descriptions-item>
      <el-descriptions-item label="备注摘要">{{ intent.noteSummary || '—' }}</el-descriptions-item>
      <el-descriptions-item label="提交时间">{{ intent.createdAt || '—' }}</el-descriptions-item>
    </el-descriptions>
    <p v-if="intent" style="color:#666">状态由运营或客服跟进。本页不提供改状态或写跟进。</p>
  </div>
</template>
