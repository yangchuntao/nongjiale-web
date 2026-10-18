<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { deleteBanner, disableBanner, enableBanner, fetchBanners } from '../api/admin'
import { describeAdminError } from '../api/errors'
import {
  BANNER_CITY_CLOSED,
  pageFromQuery,
  readQueryText,
  type BannerRecord,
  type BannerScope,
} from '../api/readers'
import {
  BANNER_CLOSED_NOTE,
  BANNER_DELETE_CONFIRM,
  BANNER_LIST_EMPTY,
  BANNER_LIST_ERROR,
  BANNER_LIST_HINT,
} from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const result = ref<PageResult<BannerRecord> | null>(null)
const actionError = ref('')
const deletingId = ref('')
const togglingId = ref('')
const broken = ref<Record<string, boolean>>({})
const keywordDraft = ref('')

const page = computed(() => pageFromQuery(route.query.page))
const enabledFilter = computed((): '' | 'true' | 'false' => {
  const value = readQueryText(route.query.enabled)
  return value === 'true' || value === 'false' ? value : ''
})
const scopeFilter = computed((): '' | BannerScope => {
  const value = readQueryText(route.query.scope)
  return value === 'ALL' || value === 'CITY' ? value : ''
})
const keyword = computed(() => readQueryText(route.query.keyword))
const filtering = computed(() => Boolean(enabledFilter.value || scopeFilter.value || keyword.value.trim()))

function pushQuery(next: { page?: number; enabled?: string; scope?: string; keyword?: string }) {
  const query: Record<string, string> = {}
  const nextPage = next.page ?? page.value
  const enabled = next.enabled ?? enabledFilter.value
  const scope = next.scope ?? scopeFilter.value
  const word = (next.keyword ?? keyword.value).trim()
  if (nextPage > 1) query.page = String(nextPage)
  if (enabled) query.enabled = enabled
  if (scope) query.scope = scope
  if (word) query.keyword = word
  void router.push({ path: '/banners', query })
}

async function load() {
  const outcome = await run((signal) =>
    fetchBanners(
      {
        page: page.value,
        enabled: enabledFilter.value,
        scope: scopeFilter.value,
        keyword: keyword.value,
      },
      signal,
    ),
  )
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') {
    result.value = null
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

watch(keyword, (value) => {
  keywordDraft.value = value
}, { immediate: true })

watch([page, enabledFilter, scopeFilter, keyword], () => void load(), { immediate: true })

async function onToggle(row: BannerRecord, enabled: boolean) {
  if (enabled === row.enabled || togglingId.value) return
  togglingId.value = row.id
  actionError.value = ''
  try {
    if (enabled) await enableBanner(row.id)
    else await disableBanner(row.id)
    ElMessage.success(enabled ? '已启用' : '已停用，首页将不再展示')
    await load()
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.kind === 'conflict' ? BANNER_CITY_CLOSED : view.message
  } finally {
    togglingId.value = ''
  }
}

async function onDelete(row: BannerRecord) {
  try {
    await ElMessageBox.confirm(BANNER_DELETE_CONFIRM, '删除 Banner', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = row.id
  actionError.value = ''
  try {
    await deleteBanner(row.id)
    ElMessage.success('已删除')
    await load()
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
  } finally {
    deletingId.value = ''
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>Banner 管理</h1>
        <p class="hint">{{ BANNER_LIST_HINT }}</p>
      </div>
      <RouterLink to="/banners/new">新建</RouterLink>
    </div>
    <el-form class="filters" @submit.prevent="pushQuery({ page: 1, keyword: keywordDraft })">
      <el-form-item label="状态">
        <el-select
          :model-value="enabledFilter"
          clearable
          placeholder="全部"
          style="width: 8rem"
          @change="pushQuery({ page: 1, enabled: $event || '' })"
        >
          <el-option label="启用" value="true" />
          <el-option label="停用" value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="范围">
        <el-select
          :model-value="scopeFilter"
          clearable
          placeholder="全部"
          style="width: 8rem"
          @change="pushQuery({ page: 1, scope: $event || '' })"
        >
          <el-option label="全站" value="ALL" />
          <el-option label="指定市" value="CITY" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="keywordDraft" clearable placeholder="标题或链接" style="width: 14rem" />
      </el-form-item>
      <el-button native-type="submit">筛选</el-button>
    </el-form>
    <el-alert v-if="actionError" :title="actionError" type="error" :closable="false" show-icon />
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="errorKind === 'generic' ? BANNER_LIST_ERROR : error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-empty v-else-if="!result?.items.length && !filtering" :description="BANNER_LIST_EMPTY">
      <RouterLink to="/banners/new">新建投放</RouterLink>
    </el-empty>
    <el-empty v-else-if="!result?.items.length" description="没有符合条件的 Banner">
      <el-button text @click="pushQuery({ page: 1, enabled: '', scope: '', keyword: '' })">重置筛选</el-button>
    </el-empty>
    <template v-else>
      <div class="table-wrap">
        <el-table :data="result.items" row-key="id">
          <el-table-column label="图片" width="148">
            <template #default="{ row }">
              <img
                v-if="!broken[row.id]"
                class="banner-thumb"
                :src="row.imageUrl"
                alt=""
                @error="broken[row.id] = true"
              />
              <span v-else class="banner-thumb"></span>
            </template>
          </el-table-column>
          <el-table-column label="标题 / 链接" min-width="200">
            <template #default="{ row }">
              <div>{{ row.title || row.linkUrl }}</div>
            </template>
          </el-table-column>
          <el-table-column label="范围" min-width="160">
            <template #default="{ row }">
              <el-tag v-if="row.scope === 'ALL'" class="tag-brand" round>全站</el-tag>
              <span v-else>
                {{ row.cityName || '指定市' }}
                <span v-if="row.cityOpen === false" class="muted">{{ BANNER_CLOSED_NOTE }}</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="启用" width="120">
            <template #default="{ row }">
              <el-switch
                :model-value="row.enabled"
                :loading="togglingId === row.id"
                @change="onToggle(row, $event === true)"
              />
              <el-tag v-if="row.enabled" type="success" round>启用</el-tag>
              <el-tag v-else class="tag-muted" round>停用</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="90" />
          <el-table-column label="操作" min-width="140" fixed="right">
            <template #default="{ row }">
              <div class="actions">
                <RouterLink :to="`/banners/${row.id}`">编辑</RouterLink>
                <el-button text type="danger" :loading="deletingId === row.id" @click="onDelete(row)">删除</el-button>
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
        @current-change="pushQuery({ page: $event })"
      />
    </template>
  </section>
</template>
