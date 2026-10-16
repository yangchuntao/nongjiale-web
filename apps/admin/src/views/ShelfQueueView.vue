<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { approveShelf, fetchShelfQueue, rejectShelf } from '../api/admin'
import { describeAdminError } from '../api/errors'
import {
  pageFromQuery,
  readQueryText,
  rejectReasonError,
  reviewStatusLabel,
  reviewTagType,
  shelfActionLabel,
  type ShelfApplication,
} from '../api/readers'
import { EMPTY_SHELF } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const result = ref<PageResult<ShelfApplication> | null>(null)
const status = ref('PENDING')
const actingId = ref('')
const actionError = ref('')
const rejectOpen = ref(false)
const rejectTarget = ref<ShelfApplication | null>(null)
const reason = ref('')
const reasonError = ref('')

const page = computed(() => pageFromQuery(route.query.page))
const appliedStatus = computed(() => readQueryText(route.query.status) || 'PENDING')

function syncForm() {
  status.value = appliedStatus.value
}

async function load() {
  const outcome = await run((signal) => fetchShelfQueue(appliedStatus.value, page.value, signal))
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') {
    result.value = null
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

function pushQuery(nextPage: number) {
  const query: Record<string, string> = {}
  if (status.value && status.value !== 'PENDING') query.status = status.value
  if (nextPage > 1) query.page = String(nextPage)
  void router.push({ path: '/shelf-requests', query })
}

watch(() => route.query, () => {
  syncForm()
  void load()
}, { immediate: true, deep: true })

async function onApprove(row: ShelfApplication) {
  try {
    await ElMessageBox.confirm('通过后游客可见性与申请类型一致。', `通过${shelfActionLabel(row.action)}申请`, {
      type: 'warning',
    })
  } catch {
    return
  }
  actingId.value = row.id
  actionError.value = ''
  try {
    await approveShelf(row.id)
    ElMessage.success('已通过')
    await load()
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
  } finally {
    actingId.value = ''
  }
}

function openReject(row: ShelfApplication) {
  rejectTarget.value = row
  reason.value = ''
  reasonError.value = ''
  rejectOpen.value = true
}

async function onReject() {
  const target = rejectTarget.value
  if (!target) return
  reasonError.value = rejectReasonError(reason.value)
  if (reasonError.value) {
    document.getElementById('shelf-reject-reason')?.focus()
    return
  }
  actingId.value = target.id
  actionError.value = ''
  try {
    await rejectShelf(target.id, reason.value)
    rejectOpen.value = false
    ElMessage.success('已驳回，游客可见性保持不变')
    await load()
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
  } finally {
    actingId.value = ''
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>上下架申请</h1>
        <p class="hint">这里只审商家提交的申请。运营直接代上下架在房源编辑页，不进本队列。</p>
      </div>
    </div>
    <el-form class="filters" @submit.prevent="pushQuery(1)">
      <el-form-item label="状态">
        <el-select v-model="status" style="width: 10rem">
          <el-option label="待审" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已驳回" value="REJECTED" />
          <el-option label="全部" value="ALL" />
        </el-select>
      </el-form-item>
      <el-button type="primary" native-type="submit">筛选</el-button>
    </el-form>
    <el-alert v-if="actionError" :title="actionError" type="error" :closable="false" show-icon />
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-empty v-else-if="!result?.items.length" :description="appliedStatus === 'PENDING' ? EMPTY_SHELF : '没有符合条件的申请'" />
    <template v-else>
      <div class="table-wrap">
        <el-table :data="result.items" row-key="id">
          <el-table-column prop="storeName" label="门店" min-width="160" />
          <el-table-column label="申请类型" width="110">
            <template #default="{ row }">{{ shelfActionLabel(row.action) }}</template>
          </el-table-column>
          <el-table-column prop="reason" label="原因" min-width="180" />
          <el-table-column prop="createdAt" label="时间" min-width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="reviewTagType(row.status)">{{ reviewStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="驳回原因" min-width="140">
            <template #default="{ row }">{{ row.rejectReason || '—' }}</template>
          </el-table-column>
          <el-table-column label="操作" min-width="140" fixed="right">
            <template #default="{ row }">
              <div v-if="row.status === 'PENDING'" class="actions">
                <el-button text :loading="actingId === row.id" @click="onApprove(row)">通过</el-button>
                <el-button text type="danger" @click="openReject(row)">驳回</el-button>
              </div>
              <span v-else class="muted">—</span>
            </template>
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
    <el-dialog v-model="rejectOpen" title="驳回上下架申请" width="28rem">
      <el-form label-position="top" @submit.prevent="onReject">
        <el-form-item label="驳回原因" :error="reasonError" required>
          <el-input id="shelf-reject-reason" v-model="reason" type="textarea" :rows="4" maxlength="500" />
        </el-form-item>
        <div class="actions">
          <el-button @click="rejectOpen = false">取消</el-button>
          <el-button type="danger" native-type="submit" :loading="Boolean(actingId)">确认驳回</el-button>
        </div>
      </el-form>
    </el-dialog>
  </section>
</template>
