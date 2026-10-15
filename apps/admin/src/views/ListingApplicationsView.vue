<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { labelOf, LISTING_ACTION_LABEL, REVIEW_STATUS_LABEL, type ListingApplication } from '@nongjiale/shared'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const acting = ref(false)
const error = ref('')
const items = ref<ListingApplication[]>([])
const total = ref(0)
const page = ref(1)
const status = ref('PENDING')
const action = ref('')
const detail = ref<ListingApplication | null>(null)
const detailError = ref('')
const detailVisible = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.fetchListingApplications(auth.token!, {
      status: status.value || undefined,
      action: action.value || undefined,
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

async function approve(row: ListingApplication | null) {
  if (!row) return
  try {
    await ElMessageBox.confirm('通过后对游客生效：上架进入可订列表，下架后退回 410。', '通过上下架')
  } catch {
    return
  }
  acting.value = true
  try {
    await api.approveListingApplication(auth.token!, row.id)
    ElMessage.success('已通过，游客侧状态已按申请类型更新')
    detailVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '通过失败')
  } finally {
    acting.value = false
  }
}

async function reject(row: ListingApplication | null) {
  if (!row) return
  let reason = ''
  try {
    const result = await ElMessageBox.prompt('驳回原因（必填）', '驳回上下架', {
      inputPattern: /\S+/,
      inputErrorMessage: '请填写驳回原因',
      confirmButtonText: '驳回',
    })
    reason = result.value.trim()
  } catch {
    return
  }
  acting.value = true
  try {
    await api.rejectListingApplication(auth.token!, row.id, reason)
    ElMessage.success('已驳回，门店对客状态保持不变')
    detailVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '驳回失败')
  } finally {
    acting.value = false
  }
}

watch([status, action], () => {
  page.value = 1
  load()
})

onMounted(load)
</script>

<template>
  <div>
    <h2>上下架审核</h2>
    <p style="color:#666">仅运营可审。通过后游客可见性立即变化；驳回不改门店状态。运营代为上下架仍在房源页。</p>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <el-select v-model="status" clearable placeholder="全部状态" style="width:160px">
        <el-option label="待审" value="PENDING" />
        <el-option label="已通过" value="APPROVED" />
        <el-option label="已驳回" value="REJECTED" />
      </el-select>
      <el-select v-model="action" clearable placeholder="全部类型" style="width:160px">
        <el-option label="上架" value="PUBLISH" />
        <el-option label="下架" value="UNPUBLISH" />
      </el-select>
    </div>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:12px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-table :data="items" v-loading="loading" stripe>
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="storeName" label="门店" />
      <el-table-column prop="subjectName" label="商家主体" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">{{ labelOf(LISTING_ACTION_LABEL, row.action) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">{{ labelOf(REVIEW_STATUS_LABEL, row.status) }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="时间" width="180" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">查看</el-button>
          <el-button size="small" type="primary" :disabled="row.status !== 'PENDING'" @click="approve(row)">通过</el-button>
          <el-button size="small" type="danger" plain :disabled="row.status !== 'PENDING'" @click="reject(row)">驳回</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无上下架申请" />
      </template>
    </el-table>
    <div v-if="total > 20" style="margin-top:12px;display:flex;justify-content:flex-end">
      <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="20" v-model:current-page="page" @current-change="load" />
    </div>

    <el-dialog v-model="detailVisible" title="上下架申请" width="560px">
      <el-alert v-if="detailError" :title="detailError" type="error" show-icon style="margin-bottom:12px" />
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="门店">{{ detail.storeName || detail.storeId }}</el-descriptions-item>
        <el-descriptions-item label="主体">{{ detail.subjectName || detail.merchantId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ labelOf(LISTING_ACTION_LABEL, detail.action) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ labelOf(REVIEW_STATUS_LABEL, detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ detail.note || '—' }}</el-descriptions-item>
        <el-descriptions-item label="驳回原因">{{ detail.rejectReason || '—' }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ detail.createdAt || '—' }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ detail.reviewedAt || '—' }}</el-descriptions-item>
      </el-descriptions>
      <p v-if="detail" style="color:#666">
        通过上架后，门户列表和详情可订；通过下架后，详情返回「该农家乐暂不可预订」。
      </p>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="danger" plain :disabled="detail?.status !== 'PENDING'" :loading="acting" @click="reject(detail)">驳回</el-button>
        <el-button type="primary" :disabled="detail?.status !== 'PENDING'" :loading="acting" @click="approve(detail)">通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>
