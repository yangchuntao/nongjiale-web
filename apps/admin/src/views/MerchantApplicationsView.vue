<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { labelOf, merchantApplicationId, REVIEW_STATUS_LABEL, type MerchantApplication } from '@nongjiale/shared'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const items = ref<MerchantApplication[]>([])
const total = ref(0)
const page = ref(1)
const status = ref('PENDING')
const detail = ref<MerchantApplication | null>(null)
const detailError = ref('')
const detailVisible = ref(false)
const acting = ref(false)

function rowId(row: MerchantApplication | null) {
  return merchantApplicationId(row)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.fetchMerchantApplications(auth.token!, {
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

async function openDetail(row: MerchantApplication) {
  const id = rowId(row)
  detail.value = row
  detailError.value = ''
  detailVisible.value = true
  if (id == null) {
    detailError.value = '申请编号缺失'
    return
  }
  try {
    detail.value = await api.fetchMerchantApplication(auth.token!, id)
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : '详情加载失败'
  }
}

async function approve(row: MerchantApplication | null) {
  const id = rowId(row)
  if (id == null) {
    ElMessage.error('申请编号缺失，无法通过')
    return
  }
  try {
    await ElMessageBox.confirm('通过后将开通商家账号。初始密码只在这次结果里出现一次。', '通过入驻')
  } catch {
    return
  }
  acting.value = true
  try {
    const data = await api.approveMerchantApplication(auth.token!, id)
    detailVisible.value = false
    if (!data?.initialPassword) {
      ElMessage.warning('已通过，但响应没有返回初始密码')
    } else {
      await ElMessageBox.alert(
        `已开通商家账号\n登录手机：${data.loginPhone || '—'}\n初始密码：${data.initialPassword}\n请线下告知商家。列表接口不会再返回该密码。`,
        '已开通商家账号',
      )
    }
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '通过失败')
  } finally {
    acting.value = false
  }
}

async function reject(row: MerchantApplication | null) {
  const id = rowId(row)
  if (id == null) {
    ElMessage.error('申请编号缺失，无法驳回')
    return
  }
  let reason = ''
  try {
    const result = await ElMessageBox.prompt('驳回原因（必填）', '驳回入驻', {
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
    await api.rejectMerchantApplication(auth.token!, id, reason)
    ElMessage.success('已驳回')
    detailVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '驳回失败')
  } finally {
    acting.value = false
  }
}

watch(status, () => {
  page.value = 1
  load()
})

onMounted(load)
</script>

<template>
  <div>
    <h2>入驻审核</h2>
    <p style="color:#666">仅运营可审。通过后开通商家账号；驳回必须填写原因。</p>
    <el-select v-model="status" clearable placeholder="全部状态" style="width:180px;margin-bottom:12px">
      <el-option label="待审" value="PENDING" />
      <el-option label="已通过" value="APPROVED" />
      <el-option label="已驳回" value="REJECTED" />
    </el-select>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:12px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-table :data="items" v-loading="loading" stripe>
      <el-table-column label="编号" width="90">
        <template #default="{ row }">{{ rowId(row) ?? '—' }}</template>
      </el-table-column>
      <el-table-column prop="subjectName" label="主体" />
      <el-table-column prop="proposedStoreName" label="拟营门店" />
      <el-table-column prop="phone" label="手机" width="140" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">{{ labelOf(REVIEW_STATUS_LABEL, row.status) }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="提交时间" width="180" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">查看</el-button>
          <el-button size="small" type="primary" :disabled="row.status !== 'PENDING'" @click="approve(row)">通过</el-button>
          <el-button size="small" type="danger" plain :disabled="row.status !== 'PENDING'" @click="reject(row)">驳回</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无入驻申请" />
      </template>
    </el-table>
    <div v-if="total > 20" style="margin-top:12px;display:flex;justify-content:flex-end">
      <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="20" v-model:current-page="page" @current-change="load" />
    </div>

    <el-dialog v-model="detailVisible" title="入驻资料" width="640px">
      <el-alert v-if="detailError" :title="detailError" type="error" show-icon style="margin-bottom:12px" />
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="状态">{{ labelOf(REVIEW_STATUS_LABEL, detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="主体">{{ detail.subjectName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detail.contactName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ detail.phone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="拟营门店">{{ detail.proposedStoreName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="地区">{{ detail.regionId ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ detail.description || '—' }}</el-descriptions-item>
        <el-descriptions-item label="证照文本">{{ detail.licenseText || '—' }}</el-descriptions-item>
        <el-descriptions-item label="驳回原因">{{ detail.rejectReason || '—' }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="detail?.licenseImageUrls?.length" style="margin-top:12px">
        <div v-for="url in detail.licenseImageUrls" :key="url">
          <a :href="url" target="_blank" rel="noreferrer">{{ url }}</a>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="danger" plain :disabled="detail?.status !== 'PENDING'" :loading="acting" @click="reject(detail)">驳回</el-button>
        <el-button type="primary" :disabled="detail?.status !== 'PENDING'" :loading="acting" @click="approve(detail)">通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>
