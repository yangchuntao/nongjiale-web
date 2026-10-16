<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { exportIntents, fetchIntents } from '../api/admin'
import { describeAdminError } from '../api/errors'
import {
  displayIntentStatus,
  guestLabel,
  intentDateLabel,
  intentExportFilename,
  intentTagMuted,
  intentTagType,
  pageFromQuery,
  readQueryText,
  todayIso,
  type IntentRecord,
} from '../api/readers'
import { EMPTY_INTENTS, EXPORT_NOTICE } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const result = ref<PageResult<IntentRecord> | null>(null)
const status = ref('')
const storeId = ref('')
const merchantOrgId = ref('')
const checkInFrom = ref('')
const checkInTo = ref('')
const createdFrom = ref('')
const createdTo = ref('')
const exporting = ref(false)

const page = computed(() => pageFromQuery(route.query.page))
const filter = computed(() => ({
  status: readQueryText(route.query.status),
  storeId: readQueryText(route.query.storeId),
  merchantOrgId: readQueryText(route.query.merchantOrgId),
  checkInFrom: readQueryText(route.query.checkInFrom),
  checkInTo: readQueryText(route.query.checkInTo),
  createdFrom: readQueryText(route.query.createdFrom),
  createdTo: readQueryText(route.query.createdTo),
  page: page.value,
}))

function syncForm() {
  status.value = filter.value.status
  storeId.value = filter.value.storeId
  merchantOrgId.value = filter.value.merchantOrgId
  checkInFrom.value = filter.value.checkInFrom
  checkInTo.value = filter.value.checkInTo
  createdFrom.value = filter.value.createdFrom
  createdTo.value = filter.value.createdTo
}

async function load() {
  const outcome = await run((signal) => fetchIntents(filter.value, signal))
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') {
    result.value = null
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

function pushQuery(nextPage: number) {
  const query: Record<string, string> = {}
  if (status.value) query.status = status.value
  if (storeId.value.trim()) query.storeId = storeId.value.trim()
  if (merchantOrgId.value.trim()) query.merchantOrgId = merchantOrgId.value.trim()
  if (checkInFrom.value) query.checkInFrom = checkInFrom.value
  if (checkInTo.value) query.checkInTo = checkInTo.value
  if (createdFrom.value) query.createdFrom = createdFrom.value
  if (createdTo.value) query.createdTo = createdTo.value
  if (nextPage > 1) query.page = String(nextPage)
  void router.push({ path: '/intents', query })
}

watch(() => route.query, () => {
  syncForm()
  void load()
}, { immediate: true, deep: true })

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function onExport() {
  exporting.value = true
  try {
    const csv = await exportIntents(filter.value)
    downloadCsv(intentExportFilename(filter.value.status, todayIso()), csv)
    ElMessage.success('已导出当前筛选结果')
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    ElMessage.error(view.message)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>意向</h1>
        <p class="notice">{{ EXPORT_NOTICE }}</p>
      </div>
      <el-button :loading="exporting" @click="onExport">导出 CSV</el-button>
    </div>
    <el-form class="filters" @submit.prevent="pushQuery(1)">
      <el-form-item label="状态">
        <el-select v-model="status" clearable placeholder="全部状态" style="width: 9rem">
          <el-option label="待跟进" value="PENDING" />
          <el-option label="已确认" value="CONFIRMED" />
          <el-option label="已改期" value="RESCHEDULED" />
          <el-option label="已入住" value="CHECKED_IN" />
          <el-option label="已关闭" value="CLOSED" />
        </el-select>
      </el-form-item>
      <el-form-item label="门店编号">
        <el-input v-model="storeId" inputmode="numeric" style="width: 8rem" />
      </el-form-item>
      <el-form-item label="主体编号">
        <el-input v-model="merchantOrgId" inputmode="numeric" style="width: 8rem" />
      </el-form-item>
      <el-form-item label="到店从">
        <el-date-picker v-model="checkInFrom" type="date" value-format="YYYY-MM-DD" placeholder="到店从" />
      </el-form-item>
      <el-form-item label="到店至">
        <el-date-picker v-model="checkInTo" type="date" value-format="YYYY-MM-DD" placeholder="到店至" />
      </el-form-item>
      <el-form-item label="创建从">
        <el-date-picker v-model="createdFrom" type="date" value-format="YYYY-MM-DD" placeholder="创建从" />
      </el-form-item>
      <el-form-item label="创建至">
        <el-date-picker v-model="createdTo" type="date" value-format="YYYY-MM-DD" placeholder="创建至" />
      </el-form-item>
      <el-button type="primary" native-type="submit">筛选</el-button>
    </el-form>
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-empty v-else-if="!result?.items.length" :description="EMPTY_INTENTS" />
    <template v-else>
      <div class="table-wrap">
        <el-table :data="result.items" row-key="id">
          <el-table-column label="单号" min-width="140">
            <template #default="{ row }">
              <RouterLink class="mono" :to="`/intents/${row.id}`">{{ row.intentNo || row.id }}</RouterLink>
            </template>
          </el-table-column>
          <el-table-column prop="storeName" label="店名" min-width="140" />
          <el-table-column label="日期" min-width="180">
            <template #default="{ row }">{{ intentDateLabel(row) || '—' }}</template>
          </el-table-column>
          <el-table-column label="人数" width="80">
            <template #default="{ row }">{{ guestLabel(row.guests) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="intentTagType(row.status)" :class="{ 'tag-muted': intentTagMuted(row.status) }" round>{{ displayIntentStatus(row.status, row.statusLabel) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="contactName" label="联系人" min-width="100" />
          <el-table-column prop="contactPhone" label="手机" min-width="130" />
          <el-table-column label="更新时间" min-width="160">
            <template #default="{ row }">{{ row.updatedAt || '—' }}</template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination
        v-if="result.total > result.pageSize"
        layout="prev, pager, next"
        :total="result.total"
        :page-size="result.pageSize"
        :current-page="result.page || page"
        @current-change="pushQuery"
      />
    </template>
  </section>
</template>
