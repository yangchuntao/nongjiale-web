<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { describeMerchantError } from '../api/errors'
import { createShelfApplication, fetchMerchantStore, fetchShelfApplications } from '../api/merchant'
import {
  shelfActionLabel,
  shelfStateLabel,
  shelfStatusLabel,
  shelfTagType,
  validateShelfReason,
  type ShelfApplication,
  type StoreDetail,
} from '../api/readers'
import { EMPTY_SHELF, SHELF_SUBMITTED } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const store = ref<StoreDetail | null>(null)
const applications = ref<PageResult<ShelfApplication> | null>(null)
const action = ref<'PUBLISH' | 'UNPUBLISH'>('PUBLISH')
const reason = ref('')
const reasonError = ref('')
const submitError = ref('')
const submitting = ref(false)

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const page = computed(() => {
  const raw = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
  const value = Number(raw || '1')
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
})
const pending = computed(() => applications.value?.items.some((item) => item.status === 'PENDING') ?? false)

async function load() {
  submitError.value = ''
  if (!id.value) return
  const outcome = await run(async (signal) => {
    const [detail, history] = await Promise.all([
      fetchMerchantStore(id.value, signal),
      fetchShelfApplications({ storeId: id.value, page: page.value }, signal),
    ])
    return { detail, history }
  })
  if (outcome.status === 'ok') {
    store.value = outcome.data.detail
    applications.value = outcome.data.history
  }
  if (outcome.status === 'error') {
    store.value = null
    applications.value = null
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

function changePage(next: number) {
  const query = next <= 1 ? {} : { page: String(next) }
  void router.push({ path: `/stores/${id.value}/shelf`, query })
}

watch([id, page], () => void load(), { immediate: true })

async function onSubmit() {
  reasonError.value = validateShelfReason(reason.value)
  submitError.value = ''
  if (reasonError.value || pending.value || !id.value) {
    if (reasonError.value) document.getElementById('shelf-reason')?.focus()
    return
  }
  submitting.value = true
  try {
    await createShelfApplication(id.value, action.value, reason.value)
    reason.value = ''
    ElMessage.success(SHELF_SUBMITTED)
    await load()
  } catch (cause) {
    const view = describeMerchantError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    submitError.value = view.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>上下架申请</h1>
        <p v-if="store" class="hint">{{ store.name || '门店' }} · 当前{{ shelfStatusLabel(store.shelfStatus) }}</p>
      </div>
      <RouterLink to="/stores">返回门店</RouterLink>
    </div>
    <el-skeleton v-if="loading && !store" :rows="6" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <template v-else-if="store">
      <el-form class="form-narrow" label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="申请类型">
          <el-radio-group v-model="action" :disabled="pending">
            <el-radio value="PUBLISH">申请上架</el-radio>
            <el-radio value="UNPUBLISH">申请下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="原因" :error="reasonError" required>
          <el-input id="shelf-reason" v-model="reason" type="textarea" :rows="4" :disabled="pending" maxlength="500" />
        </el-form-item>
        <el-alert v-if="pending" title="已有待审申请，请等待运营审核后再提交。" type="warning" :closable="false" show-icon />
        <el-alert v-if="submitError" :title="submitError" type="error" :closable="false" show-icon />
        <el-button type="primary" native-type="submit" :loading="submitting" :disabled="pending">提交申请</el-button>
      </el-form>

      <h2>申请记录</h2>
      <el-empty v-if="!applications?.items.length" :description="EMPTY_SHELF">
        <p class="hint">在上方提交申请。通过前游客可见性不变。</p>
      </el-empty>
      <template v-else>
        <div class="table-wrap">
          <el-table :data="applications.items" row-key="id">
            <el-table-column label="门店" min-width="140">
              <template #default="{ row }">{{ row.storeName || '—' }}</template>
            </el-table-column>
            <el-table-column label="类型" min-width="100">
              <template #default="{ row }">{{ shelfActionLabel(row.action) }}</template>
            </el-table-column>
            <el-table-column label="状态" min-width="100">
              <template #default="{ row }">
                <el-tag :type="shelfTagType(row.status)">{{ shelfStateLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="申请原因" min-width="180">
              <template #default="{ row }">{{ row.reason || '—' }}</template>
            </el-table-column>
            <el-table-column label="驳回原因" min-width="180">
              <template #default="{ row }">{{ row.rejectReason || '—' }}</template>
            </el-table-column>
            <el-table-column label="时间" min-width="160">
              <template #default="{ row }">{{ row.createdAt || '—' }}</template>
            </el-table-column>
          </el-table>
        </div>
        <el-pagination
          v-if="applications.total > applications.pageSize"
          layout="prev, pager, next"
          :total="applications.total"
          :page-size="applications.pageSize"
          :current-page="applications.page || page"
          @current-change="changePage"
        />
      </template>
    </template>
  </section>
</template>

<style scoped>
h2 {
  margin: 0;
  font-size: var(--font-h2);
}
</style>
