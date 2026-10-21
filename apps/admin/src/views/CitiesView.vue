<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RouterLink, useRouter } from 'vue-router'
import { fetchCities, fetchCityOptions, syncRegions } from '../api/admin'
import { describeAdminError } from '../api/errors'
import { cityTitle, cityUpdatedLabel, openStatusLabel, pageFromQuery, readQueryText, type CitySummary } from '../api/readers'
import { CITY_LIST_EMPTY, CITY_LIST_ERROR, CITY_SYNC_HINT, CITY_UNIT_HINT, citySyncConfirm } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const result = ref<PageResult<CitySummary> | null>(null)
const provinces = ref<string[]>([])
const syncing = ref(false)

// 表单态（可编辑），应用态从路由读，点「查询」才生效
const statusForm = ref('')
const provinceForm = ref('')
const keywordForm = ref('')
const page = computed(() => pageFromQuery(routePage()))
const status = computed(() => readQueryText(routeValue('status')))
const province = computed(() => readQueryText(routeValue('province')))
const keyword = computed(() => readQueryText(routeValue('keyword')))

function routePage(): unknown {
  const raw = router.currentRoute.value.query.page
  return Array.isArray(raw) ? raw[0] : raw
}

function routeValue(key: string): unknown {
  const raw = router.currentRoute.value.query[key]
  return Array.isArray(raw) ? raw[0] : raw
}

function syncForm() {
  statusForm.value = status.value
  provinceForm.value = province.value
  keywordForm.value = keyword.value
}

async function load() {
  const outcome = await run((signal) =>
    fetchCities(
      { page: page.value, status: status.value, province: province.value, keyword: keyword.value },
      signal,
    ),
  )
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') {
    result.value = null
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

function pushQuery(nextPage: number) {
  const query: Record<string, string> = {}
  if (statusForm.value) query.status = statusForm.value
  if (provinceForm.value) query.province = provinceForm.value
  const keywordText = keywordForm.value.trim()
  if (keywordText) query.keyword = keywordText
  if (nextPage > 1) query.page = String(nextPage)
  void router.push({ path: '/cities', query })
}

function resetFilters() {
  statusForm.value = ''
  provinceForm.value = ''
  keywordForm.value = ''
  void router.push({ path: '/cities' })
}

/** 同步全国区划：把内置省市区数据导入，新增的城市会出现在本列表里。 */
async function onSync() {
  if (syncing.value) return
  try {
    await ElMessageBox.confirm(citySyncConfirm(), '同步全国区划', {
      confirmButtonText: '开始同步',
      cancelButtonText: '取消',
      type: 'info',
    })
  } catch {
    return
  }
  syncing.value = true
  try {
    const result = await syncRegions()
    ElMessage.success(
      `同步完成：共 ${result.total} 条，新增 ${result.inserted}，更新 ${result.updated}，未变 ${result.skipped}`,
    )
    await load()
    await loadProvinces()
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    ElMessage.error(view.message)
  } finally {
    syncing.value = false
  }
}

/** 省下拉选项来自一次不带筛选的城市取数（pageSize=100，当前城市量远小于上限）。 */
async function loadProvinces() {
  try {
    const items = await fetchCityOptions()
    const names = new Set<string>()
    for (const city of items) {
      if (city.provinceName) names.add(city.provinceName)
    }
    provinces.value = [...names]
  } catch {
    provinces.value = []
  }
}

watch(
  () => router.currentRoute.value.query,
  () => {
    syncForm()
    void load()
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  void loadProvinces()
})
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>开城/目的地</h1>
        <p class="hint">{{ CITY_UNIT_HINT }}</p>
      </div>
      <el-button :loading="syncing" @click="onSync">同步全国区划</el-button>
      <el-button @click="load">刷新</el-button>
    </div>
    <p class="hint">{{ CITY_SYNC_HINT }}</p>
    <el-form class="filters" @submit.prevent="pushQuery(1)">
      <el-form-item label="状态">
        <el-select v-model="statusForm" clearable placeholder="全部" style="width: 8rem">
          <el-option label="已开通" value="OPEN" />
          <el-option label="未开通" value="CLOSED" />
        </el-select>
      </el-form-item>
      <el-form-item label="省">
        <el-select v-model="provinceForm" clearable filterable placeholder="全部" style="width: 10rem">
          <el-option v-for="name in provinces" :key="name" :label="name" :value="name" />
        </el-select>
      </el-form-item>
      <el-form-item label="市名">
        <el-input v-model="keywordForm" clearable placeholder="搜索省名 / 市名" style="width: 12rem" />
      </el-form-item>
      <el-button type="primary" size="small" native-type="submit">查询</el-button>
      <el-button text type="primary" @click="resetFilters">重置</el-button>
    </el-form>
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="errorKind === 'generic' ? CITY_LIST_ERROR : error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-empty v-else-if="!result?.items.length" :description="CITY_LIST_EMPTY" />
    <template v-else>
      <div class="table-wrap">
        <el-table :data="result.items" row-key="id">
          <el-table-column label="市名" min-width="180">
            <template #default="{ row }">{{ cityTitle(row) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag v-if="row.openStatus === 'OPEN'" type="success" round>{{ openStatusLabel(row.openStatus) }}</el-tag>
              <el-tag v-else class="tag-muted" round>{{ openStatusLabel(row.openStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="storeCount" label="上架可意向店数" min-width="140" />
          <el-table-column prop="articleCount" label="攻略数" min-width="100" />
          <el-table-column label="最近操作时间" min-width="160">
            <template #default="{ row }">{{ cityUpdatedLabel(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <RouterLink :to="`/cities/${row.id}`">进入详情</RouterLink>
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
  </section>
</template>
