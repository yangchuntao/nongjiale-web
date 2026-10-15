<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { labelOf, LISTING_STATE_LABEL, STORE_STATUS_LABEL, type MerchantStore, type Region } from '@nongjiale/shared'
import * as api from '../api'
import { ApiError } from '../utils/http'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const items = ref<MerchantStore[]>([])
const total = ref(0)
const page = ref(1)
const regions = ref<Region[]>([])

function regionName(id: number) {
  return regions.value.find((item) => item.id === id)?.name || String(id)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [storePage, regionList] = await Promise.all([
      api.fetchStores(auth.token!, page.value, 20),
      regions.value.length ? Promise.resolve(regions.value) : api.fetchRegions().catch(() => [] as Region[]),
    ])
    items.value = Array.isArray(storePage?.items) ? storePage.items : []
    total.value = typeof storePage?.total === 'number' ? storePage.total : items.value.length
    if (!regions.value.length) regions.value = regionList
  } catch (e) {
    items.value = []
    total.value = 0
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function remove(row: MerchantStore) {
  try {
    await ElMessageBox.confirm(`删除门店「${row.name}」？仅草稿或已下架且没有待审申请时可以删除。`, '删除门店', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await api.deleteStore(auth.token!, row.id)
    ElMessage.success('已删除')
    await load()
  } catch (e) {
    const message = e instanceof Error ? e.message : '删除失败'
    if (e instanceof ApiError && (e.httpStatus === 422 || e.httpStatus === 409)) {
      ElMessage.error(message)
      return
    }
    ElMessage.error(message)
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2>门店</h2>
      <el-button type="primary" @click="router.push('/stores/new')">新建门店</el-button>
    </div>
    <p style="color:#666">只显示本主体门店。上架/下架不能在这里改状态，请提交申请。</p>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:12px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-table :data="items" v-loading="loading" stripe>
      <el-table-column prop="name" label="店名" />
      <el-table-column label="地区" width="140">
        <template #default="{ row }">{{ regionName(row.regionId) }}</template>
      </el-table-column>
      <el-table-column label="对客状态" width="120">
        <template #default="{ row }">{{ labelOf(STORE_STATUS_LABEL, row.status) }}</template>
      </el-table-column>
      <el-table-column label="申请态" width="150">
        <template #default="{ row }">{{ labelOf(LISTING_STATE_LABEL, row.listingStatus) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="router.push(`/stores/${row.id}`)">编辑</el-button>
          <el-button size="small" type="danger" plain @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无门店，联系运营或新建一家草稿门店" />
      </template>
    </el-table>
    <div v-if="total > 20" style="margin-top:12px;display:flex;justify-content:flex-end">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="total"
        :page-size="20"
        v-model:current-page="page"
        @current-change="load"
      />
    </div>
  </div>
</template>
