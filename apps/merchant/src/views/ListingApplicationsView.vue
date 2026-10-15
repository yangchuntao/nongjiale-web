<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  labelOf,
  LISTING_ACTION_LABEL,
  LISTING_STATE_LABEL,
  REVIEW_STATUS_LABEL,
  STORE_STATUS_LABEL,
  type ListingApplication,
  type MerchantStore,
} from '@nongjiale/shared'
import * as api from '../api'
import { ApiError } from '../utils/http'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const stores = ref<MerchantStore[]>([])
const items = ref<ListingApplication[]>([])
const total = ref(0)
const page = ref(1)
const status = ref('')
const detail = ref<ListingApplication | null>(null)
const detailError = ref('')
const detailVisible = ref(false)

const presetStoreId = Number(route.query.storeId)
const listStoreId = ref<number | undefined>(presetStoreId || undefined)
const form = reactive({
  storeId: (presetStoreId || undefined) as number | undefined,
  action: 'PUBLISH' as 'PUBLISH' | 'UNPUBLISH',
  note: '',
})

const currentStore = computed(() => stores.value.find((item) => item.id === form.storeId))

const blockReason = computed(() => {
  const store = currentStore.value
  if (!store) return ''
  if (form.action === 'PUBLISH' && store.status === 'ON_SALE') return '该门店已上架，不能再申请上架'
  if (form.action === 'UNPUBLISH' && store.status !== 'ON_SALE') return '仅已上架门店可申请下架'
  if (form.action === 'PUBLISH' && store.listingStatus === 'PUBLISH_PENDING') return '已有上架申请待审，请勿重复提交'
  if (form.action === 'UNPUBLISH' && store.listingStatus === 'UNPUBLISH_PENDING') return '已有下架申请待审，请勿重复提交'
  const duplicated = items.value.some((item) => item.storeId === store.id && item.action === form.action && item.status === 'PENDING')
  if (duplicated) return '已有同类型申请待审，请勿重复提交'
  return ''
})

async function loadStores() {
  const pageData = await api.fetchStores(auth.token!, 1, 50)
  stores.value = Array.isArray(pageData?.items) ? pageData.items : []
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!stores.value.length) await loadStores()
    const data = await api.fetchListingApplications(auth.token!, {
      storeId: listStoreId.value,
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

async function submit() {
  if (!form.storeId) {
    ElMessage.warning('请选择门店')
    return
  }
  if (blockReason.value) {
    ElMessage.warning(blockReason.value)
    return
  }
  submitting.value = true
  try {
    await api.createListingApplication(auth.token!, form.storeId, {
      action: form.action,
      note: form.note.trim() || undefined,
    })
    ElMessage.success('已提交，等待运营审核')
    form.note = ''
    await loadStores()
    await load()
  } catch (e) {
    const message = e instanceof Error ? e.message : '提交失败'
    ElMessage.error(message)
    if (e instanceof ApiError && (e.httpStatus === 409 || e.httpStatus === 422)) await load()
  } finally {
    submitting.value = false
  }
}

async function openDetail(row: ListingApplication) {
  detail.value = row
  detailError.value = ''
  detailVisible.value = true
  try {
    detail.value = await api.fetchListingApplication(auth.token!, row.id)
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : '详情加载失败'
  }
}

watch([status, listStoreId], () => {
  page.value = 1
  load()
})

onMounted(load)
</script>

<template>
  <div>
    <h2>上下架申请</h2>
    <p style="color:#666">提交后游客侧状态不变，直到运营通过。不能直接修改门店 status。</p>
    <el-card style="margin-bottom:16px">
      <el-form label-width="88px" @submit.prevent="submit">
        <el-form-item label="门店">
          <el-select v-model="form.storeId" placeholder="选择门店" style="width:100%">
            <el-option
              v-for="store in stores"
              :key="store.id"
              :label="`${store.name}（${labelOf(STORE_STATUS_LABEL, store.status)} / ${labelOf(LISTING_STATE_LABEL, store.listingStatus)}）`"
              :value="store.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.action">
            <el-radio value="PUBLISH">上架</el-radio>
            <el-radio value="UNPUBLISH">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.note" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
        <el-alert v-if="blockReason" :title="blockReason" type="warning" show-icon style="margin-bottom:12px" />
        <el-button type="primary" native-type="submit" :loading="submitting" :disabled="!!blockReason">提交申请</el-button>
      </el-form>
    </el-card>

    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
      <el-select v-model="listStoreId" clearable placeholder="全部门店" style="width:220px">
        <el-option v-for="store in stores" :key="store.id" :label="store.name" :value="store.id" />
      </el-select>
      <el-select v-model="status" clearable placeholder="全部状态" style="width:160px">
        <el-option label="待审" value="PENDING" />
        <el-option label="已通过" value="APPROVED" />
        <el-option label="已驳回" value="REJECTED" />
      </el-select>
    </div>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:12px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-table :data="items" v-loading="loading" stripe>
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="storeName" label="门店" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">{{ labelOf(LISTING_ACTION_LABEL, row.action) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">{{ labelOf(REVIEW_STATUS_LABEL, row.status) }}</template>
      </el-table-column>
      <el-table-column prop="rejectReason" label="驳回原因" />
      <el-table-column prop="createdAt" label="提交时间" width="180" />
      <el-table-column label="操作" width="90">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">查看</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无上下架申请" />
      </template>
    </el-table>
    <div v-if="total > 20" style="margin-top:12px;display:flex;justify-content:flex-end">
      <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="20" v-model:current-page="page" @current-change="load" />
    </div>

    <el-dialog v-model="detailVisible" title="申请详情" width="520px">
      <el-alert v-if="detailError" :title="detailError" type="error" show-icon />
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="门店">{{ detail.storeName || detail.storeId }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ labelOf(LISTING_ACTION_LABEL, detail.action) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ labelOf(REVIEW_STATUS_LABEL, detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ detail.note || '—' }}</el-descriptions-item>
        <el-descriptions-item label="驳回原因">{{ detail.rejectReason || '—' }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ detail.createdAt || '—' }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ detail.reviewedAt || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
