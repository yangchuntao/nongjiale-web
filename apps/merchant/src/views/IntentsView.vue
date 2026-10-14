<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { INTENT_STATUS_LABEL, labelOf, type MerchantIntent, type MerchantStore } from '@nongjiale/shared'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const items = ref<MerchantIntent[]>([])
const stores = ref<MerchantStore[]>([])
const total = ref(0)
const page = ref(1)
const status = ref('')
const storeId = ref<number | undefined>()

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!stores.value.length) {
      const storePage = await api.fetchStores(auth.token!, 1, 50).catch(() => null)
      stores.value = storePage && Array.isArray(storePage.items) ? storePage.items : []
    }
    const data = await api.fetchIntents(auth.token!, {
      storeId: storeId.value,
      status: status.value || undefined,
      page: page.value,
      pageSize: 20,
    })
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

watch([status, storeId], () => {
  page.value = 1
  load()
})

onMounted(load)
</script>

<template>
  <div>
    <h2>意向 <el-tag type="info">只读</el-tag></h2>
    <p style="color:#666">仅本主体门店。手机号已脱敏。不能改状态，也不能写跟进。</p>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <el-select v-model="storeId" clearable placeholder="全部门店" style="width:220px">
        <el-option v-for="store in stores" :key="store.id" :label="store.name" :value="store.id" />
      </el-select>
      <el-select v-model="status" clearable placeholder="全部状态" style="width:160px">
        <el-option v-for="(text, key) in INTENT_STATUS_LABEL" :key="key" :label="text" :value="key" />
      </el-select>
    </div>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:12px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-table :data="items" v-loading="loading" stripe>
      <el-table-column prop="intentNo" label="单号" width="160" />
      <el-table-column prop="storeName" label="门店" />
      <el-table-column prop="checkIn" label="到店" width="120" />
      <el-table-column prop="guests" label="人数" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">{{ labelOf(INTENT_STATUS_LABEL, row.status) }}</template>
      </el-table-column>
      <el-table-column label="手机" width="140">
        <template #default="{ row }">{{ row.contactPhoneMasked || '—' }}</template>
      </el-table-column>
      <el-table-column prop="noteSummary" label="备注摘要" />
      <el-table-column label="操作" width="90">
        <template #default="{ row }">
          <el-button size="small" @click="router.push(`/intents/${row.id}`)">查看</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无意向单" />
      </template>
    </el-table>
    <div v-if="total > 20" style="margin-top:12px;display:flex;justify-content:flex-end">
      <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="20" v-model:current-page="page" @current-change="load" />
    </div>
  </div>
</template>
