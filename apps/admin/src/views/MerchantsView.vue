<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchMerchants, resetMerchantPassword, setMerchantStatus } from '../api/admin'
import { describeAdminError } from '../api/errors'
import {
  generateTemporaryPassword,
  orgLabel,
  pageFromQuery,
  passwordError,
  readQueryText,
  type MerchantOrg,
} from '../api/readers'
import { EMPTY_MERCHANTS } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const result = ref<PageResult<MerchantOrg> | null>(null)
const status = ref('ALL')
const actingId = ref('')
const actionError = ref('')
const resetOpen = ref(false)
const resetTarget = ref<MerchantOrg | null>(null)
const nextPassword = ref('')
const nextPasswordError = ref('')

const page = computed(() => pageFromQuery(route.query.page))
const appliedStatus = computed(() => readQueryText(route.query.status) || 'ALL')

function syncForm() {
  status.value = appliedStatus.value
}

async function load() {
  const outcome = await run((signal) => fetchMerchants(appliedStatus.value, page.value, signal))
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') {
    result.value = null
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

function clearFilters() {
  status.value = 'ALL'
  void router.push('/merchants')
}

function pushQuery(nextPage: number) {
  const query: Record<string, string> = {}
  if (status.value && status.value !== 'ALL') query.status = status.value
  if (nextPage > 1) query.page = String(nextPage)
  void router.push({ path: '/merchants', query })
}

watch(() => route.query, () => {
  syncForm()
  void load()
}, { immediate: true, deep: true })

async function toggleStatus(row: MerchantOrg) {
  const next = row.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED'
  try {
    await ElMessageBox.confirm(
      next === 'ACTIVE' ? '启用后该主体可以登录商家端。' : '停用后商家端不可用。',
      next === 'ACTIVE' ? '启用商家' : '停用商家',
      { type: 'warning' },
    )
  } catch {
    return
  }
  actingId.value = row.id
  actionError.value = ''
  try {
    await setMerchantStatus(row.id, next)
    ElMessage.success(next === 'ACTIVE' ? '已启用' : '已停用')
    await load()
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
  } finally {
    actingId.value = ''
  }
}

function openReset(row: MerchantOrg) {
  resetTarget.value = row
  nextPassword.value = ''
  nextPasswordError.value = ''
  resetOpen.value = true
}

function fillPassword() {
  nextPassword.value = generateTemporaryPassword()
  nextPasswordError.value = ''
}

async function onReset() {
  const target = resetTarget.value
  if (!target) return
  nextPasswordError.value = nextPassword.value.trim() ? passwordError(nextPassword.value) : ''
  if (nextPasswordError.value) {
    document.getElementById('reset-password')?.focus()
    return
  }
  actingId.value = target.id
  actionError.value = ''
  try {
    const issued = await resetMerchantPassword(target.id, nextPassword.value)
    resetOpen.value = false
    nextPassword.value = ''
    await ElMessageBox.alert(
      `手机：${issued.phone || target.users.map((user) => user.phone).filter(Boolean).join('、') || '—'}\n一次性密码：${issued.plainPassword}\n请当场告知商家。关闭后不再显示。`,
      '密码已重置',
      { confirmButtonText: '我已记下' },
    )
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
  } finally {
    actingId.value = ''
  }
}

function userPhones(row: MerchantOrg): string {
  const phones = row.users.map((user) => user.phone).filter(Boolean)
  return phones.join('、') || row.contactPhone || '—'
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>商家</h1>
        <p class="hint">按主体启停。重置密码返回的明文只展示一次。不在此新建门店。</p>
      </div>
    </div>
    <el-form class="filters" @submit.prevent="pushQuery(1)">
      <el-form-item label="状态">
        <el-select v-model="status" style="width: 10rem">
          <el-option label="全部" value="ALL" />
          <el-option label="启用" value="ACTIVE" />
          <el-option label="停用" value="DISABLED" />
        </el-select>
      </el-form-item>
      <el-button type="primary" native-type="submit">筛选</el-button>
    </el-form>
    <el-alert v-if="actionError" :title="actionError" type="error" :closable="false" show-icon />
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-empty v-else-if="!result?.items.length" :description="EMPTY_MERCHANTS">
      <el-button text @click="clearFilters">查看全部</el-button>
    </el-empty>
    <template v-else>
      <div class="table-wrap">
        <el-table :data="result.items" row-key="id">
          <el-table-column label="主体" min-width="160">
            <template #default="{ row }">{{ orgLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="账号手机" min-width="180">
            <template #default="{ row }">{{ userPhones(row) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'DISABLED' ? 'danger' : 'success'">
                {{ row.status === 'DISABLED' ? '停用' : '启用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="180" fixed="right">
            <template #default="{ row }">
              <div class="actions">
                <el-button text :loading="actingId === row.id" @click="toggleStatus(row)">
                  {{ row.status === 'DISABLED' ? '启用' : '停用' }}
                </el-button>
                <el-button text @click="openReset(row)">重置密码</el-button>
              </div>
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
    <el-dialog v-model="resetOpen" title="重置密码" width="28rem">
      <p v-if="resetTarget" class="hint">{{ orgLabel(resetTarget) }}。留空则由服务端生成密码。</p>
      <el-form label-position="top" @submit.prevent="onReset">
        <el-form-item label="新密码（可选）" :error="nextPasswordError">
          <el-input id="reset-password" v-model="nextPassword" type="text" autocomplete="off" maxlength="64" />
        </el-form-item>
        <div class="actions">
          <el-button @click="fillPassword">生成临时密码</el-button>
          <el-button type="primary" native-type="submit" :loading="actingId === resetTarget?.id">确认重置</el-button>
        </div>
      </el-form>
    </el-dialog>
  </section>
</template>
