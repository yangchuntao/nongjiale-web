<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchStores } from '../api/admin'
import {
  orgLabel,
  pageFromQuery,
  readQueryText,
  regionLabel,
  shelfStatusLabel,
  type StoreDetail,
} from '../api/readers'
import { EMPTY_LISTINGS } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const result = ref<PageResult<StoreDetail> | null>(null)
const regionId = ref('')
const shelfStatus = ref('')
const homeRecommended = ref('')
const merchantOrgId = ref('')
const name = ref('')

const page = computed(() => pageFromQuery(route.query.page))
const filter = computed(() => ({
  regionId: readQueryText(route.query.regionId),
  shelfStatus: readQueryText(route.query.shelfStatus),
  homeRecommended: readQueryText(route.query.homeRecommended),
  merchantOrgId: readQueryText(route.query.merchantOrgId),
  name: readQueryText(route.query.name),
  page: page.value,
}))

function syncForm() {
  regionId.value = filter.value.regionId
  shelfStatus.value = filter.value.shelfStatus
  homeRecommended.value = filter.value.homeRecommended
  merchantOrgId.value = filter.value.merchantOrgId
  name.value = filter.value.name
}

async function load() {
  const outcome = await run((signal) => fetchStores(filter.value, signal))
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') {
    result.value = null
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

function pushQuery(nextPage: number) {
  const query: Record<string, string> = {}
  if (regionId.value.trim()) query.regionId = regionId.value.trim()
  if (shelfStatus.value) query.shelfStatus = shelfStatus.value
  if (homeRecommended.value) query.homeRecommended = homeRecommended.value
  if (merchantOrgId.value.trim()) query.merchantOrgId = merchantOrgId.value.trim()
  if (name.value.trim()) query.name = name.value.trim()
  if (nextPage > 1) query.page = String(nextPage)
  void router.push({ path: '/listings', query })
}

watch(() => route.query, () => {
  syncForm()
  void load()
}, { immediate: true, deep: true })
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>房源</h1>
        <p class="hint">代编资料、首页推荐和代上下架都在编辑页。推荐标记不在入驻或上下架队列里处理。</p>
      </div>
    </div>
    <el-form class="filters" @submit.prevent="pushQuery(1)">
      <el-form-item label="名称">
        <el-input v-model="name" style="width: 10rem" />
      </el-form-item>
      <el-form-item label="地区编号">
        <el-input v-model="regionId" inputmode="numeric" style="width: 8rem" />
      </el-form-item>
      <el-form-item label="主体编号">
        <el-input v-model="merchantOrgId" inputmode="numeric" style="width: 8rem" />
      </el-form-item>
      <el-form-item label="上架状态">
        <el-select v-model="shelfStatus" clearable placeholder="全部" style="width: 8rem">
          <el-option label="已上架" value="ON_SHELF" />
          <el-option label="已下架" value="OFF_SHELF" />
          <el-option label="草稿" value="DRAFT" />
        </el-select>
      </el-form-item>
      <el-form-item label="首页推荐">
        <el-select v-model="homeRecommended" clearable placeholder="全部" style="width: 8rem">
          <el-option label="推荐" value="true" />
          <el-option label="未推荐" value="false" />
        </el-select>
      </el-form-item>
      <el-button type="primary" native-type="submit">筛选</el-button>
    </el-form>
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-empty v-else-if="!result?.items.length" :description="EMPTY_LISTINGS" />
    <template v-else>
      <div class="table-wrap">
        <el-table :data="result.items" row-key="id">
          <el-table-column prop="name" label="名称" min-width="160" />
          <el-table-column label="地区" min-width="100">
            <template #default="{ row }">{{ regionLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="上架状态" min-width="110">
            <template #default="{ row }">
              <el-tag :type="row.shelfStatus === 'ON_SHELF' ? 'success' : 'info'">
                {{ shelfStatusLabel(row.shelfStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="首页推荐" width="110">
            <template #default="{ row }">{{ row.homeRecommended ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="排序值" width="90">
            <template #default="{ row }">{{ row.homeSort ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="主体" min-width="120">
            <template #default="{ row }">{{ orgLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <RouterLink :to="`/listings/${row.id}`">编辑</RouterLink>
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
