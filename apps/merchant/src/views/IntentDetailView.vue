<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchMerchantIntent } from '../api/merchant'
import {
  displayContactPhone,
  guestLabel,
  intentDateLabel,
  intentStatusLabel,
  intentTagType,
  type IntentRecord,
} from '../api/readers'
import { MERCHANT_INTENT_NOTICE } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const intent = ref<IntentRecord | null>(null)

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))

async function load() {
  intent.value = null
  if (!id.value) return
  const outcome = await run((signal) => fetchMerchantIntent(id.value, signal))
  if (outcome.status === 'ok') intent.value = outcome.data
  if (outcome.status === 'error') await leaveIfDisabled(errorKind.value, auth, router)
}

watch(id, () => void load(), { immediate: true })
</script>

<template>
  <section class="page">
    <div class="page-head">
      <h1>意向详情</h1>
      <RouterLink to="/intents">返回列表</RouterLink>
    </div>
    <el-alert :title="MERCHANT_INTENT_NOTICE" type="info" :closable="false" show-icon />
    <el-skeleton v-if="loading" :rows="8" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-descriptions v-else-if="intent" :column="1" border>
      <el-descriptions-item label="单号">
        <span class="mono">{{ intent.intentNo || intent.id }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="intentTagType(intent.status)">{{ intentStatusLabel(intent.status) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="门店">{{ intent.storeName || '—' }}</el-descriptions-item>
      <el-descriptions-item label="日期">{{ intentDateLabel(intent) }}</el-descriptions-item>
      <el-descriptions-item label="人数">{{ guestLabel(intent.guests) }}</el-descriptions-item>
      <el-descriptions-item label="联系人">{{ intent.contactName || '—' }}</el-descriptions-item>
      <el-descriptions-item label="手机">{{ displayContactPhone(intent.contactPhone) || '—' }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ intent.userRemark || '—' }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ intent.createdAt || '—' }}</el-descriptions-item>
    </el-descriptions>
  </section>
</template>
