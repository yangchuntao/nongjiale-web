<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const storeCount = ref<number | null>(null)
const pendingListingApplications = ref<number | null>(null)
const newIntentCount = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.fetchDashboard(auth.token!)
    storeCount.value = typeof data?.storeCount === 'number' ? data.storeCount : null
    pendingListingApplications.value = typeof data?.pendingListingApplications === 'number' ? data.pendingListingApplications : null
    newIntentCount.value = typeof data?.newIntentCount === 'number' ? data.newIntentCount : null
    if (storeCount.value == null || pendingListingApplications.value == null || newIntentCount.value == null) {
      error.value = '工作台计数不完整，请稍后重试'
    }
  } catch (e) {
    storeCount.value = null
    pendingListingApplications.value = null
    newIntentCount.value = null
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2>工作台</h2>
    <p style="color:#666">只统计本主体。这里没有结算、对账或支付入口。</p>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:16px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-row v-loading="loading" :gutter="16">
      <el-col :span="8">
        <el-card shadow="hover" style="cursor:pointer" @click="router.push('/stores')">
          <div>门店数</div>
          <div style="font-size:28px;font-weight:700">{{ storeCount == null ? '—' : storeCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" style="cursor:pointer" @click="router.push('/listing-applications')">
          <div>待审上下架申请</div>
          <div style="font-size:28px;font-weight:700">{{ pendingListingApplications == null ? '—' : pendingListingApplications }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" style="cursor:pointer" @click="router.push('/intents')">
          <div>新意向（只读）</div>
          <div style="font-size:28px;font-weight:700">{{ newIntentCount == null ? '—' : newIntentCount }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-empty
      v-if="!loading && !error && storeCount === 0 && pendingListingApplications === 0 && newIntentCount === 0"
      description="暂无待办"
    />
  </div>
</template>
