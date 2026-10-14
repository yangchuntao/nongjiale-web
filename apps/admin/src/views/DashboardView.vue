<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const pendingIntents = ref<number | null>(null)
const pendingMessages = ref<number | null>(null)
const pendingMerchantApplications = ref<number | null>(null)
const pendingListingApplications = ref<number | null>(null)

const nothingTodo = () => {
  const counts = [pendingIntents.value, pendingMessages.value]
  if (auth.isOperator) counts.push(pendingMerchantApplications.value, pendingListingApplications.value)
  return counts.every((value) => value === 0)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.fetchDashboard(auth.token!)
    pendingIntents.value = typeof data?.pendingIntents === 'number' ? data.pendingIntents : null
    pendingMessages.value = typeof data?.pendingMessages === 'number' ? data.pendingMessages : null
    pendingMerchantApplications.value = typeof data?.pendingMerchantApplications === 'number' ? data.pendingMerchantApplications : null
    pendingListingApplications.value = typeof data?.pendingListingApplications === 'number' ? data.pendingListingApplications : null
  } catch (e) {
    pendingIntents.value = null
    pendingMessages.value = null
    pendingMerchantApplications.value = null
    pendingListingApplications.value = null
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
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:16px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-row v-loading="loading" :gutter="16">
      <el-col :span="8">
        <el-card shadow="hover" style="cursor:pointer" @click="router.push('/intents')">
          <div>待跟进意向</div>
          <div style="font-size:28px;font-weight:700">{{ pendingIntents == null ? '—' : pendingIntents }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div>待处理留言</div>
          <div style="font-size:28px;font-weight:700">{{ pendingMessages == null ? '—' : pendingMessages }}</div>
        </el-card>
      </el-col>
      <template v-if="auth.isOperator">
        <el-col :span="8">
          <el-card shadow="hover" style="cursor:pointer" @click="router.push('/merchant-applications')">
            <div>待审入驻</div>
            <div style="font-size:28px;font-weight:700">{{ pendingMerchantApplications == null ? '—' : pendingMerchantApplications }}</div>
            <div v-if="pendingMerchantApplications == null" style="color:#999;font-size:12px">计数接口尚未返回</div>
          </el-card>
        </el-col>
        <el-col :span="8" style="margin-top:16px">
          <el-card shadow="hover" style="cursor:pointer" @click="router.push('/listing-applications')">
            <div>待审上下架</div>
            <div style="font-size:28px;font-weight:700">{{ pendingListingApplications == null ? '—' : pendingListingApplications }}</div>
            <div v-if="pendingListingApplications == null" style="color:#999;font-size:12px">计数接口尚未返回</div>
          </el-card>
        </el-col>
      </template>
    </el-row>
    <el-empty v-if="!loading && !error && nothingTodo()" description="暂无待办" />
  </div>
</template>
