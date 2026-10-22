<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchApplies, fetchQueueCounts } from '../api/admin'
import { orgLabel, pageFromQuery, readQueryText, reviewStatusLabel, reviewTagType, type MerchantApply } from '../api/readers'
import { EMPTY_APPLIES } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const result = ref<PageResult<MerchantApply> | null>(null)
const status = ref('PENDING')
const counts = ref({ intents: '—', applies: '—', shelf: '—' })

const page = computed(() => pageFromQuery(route.query.page))
const appliedStatus = computed(() => readQueryText(route.query.status) || 'PENDING')

function syncForm() {
  status.value = appliedStatus.value
}

async function load() {
  const outcome = await run((signal) => fetchApplies(appliedStatus.value, page.value, signal))
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
  void router.push({ path: '/applies', query })
}

function resetFilters() {
  status.value = 'PENDING'
  void router.push({ path: '/applies' })
}

async function loadCounts() {
  try {
    counts.value = await fetchQueueCounts().then((data) => ({
      intents: String(data.intents),
      applies: String(data.merchantApplies),
      shelf: String(data.shelfApplications),
    }))
  } catch {
    counts.value = { intents: '—', applies: '—', shelf: '—' }
  }
}

onMounted(() => {
  void loadCounts()
})

watch(() => route.query, () => {
  syncForm()
  void load()
}, { immediate: true, deep: true })
</script>

<template>
  <section class="page">
    <nav class="summary-grid" aria-label="工作台">
      <RouterLink class="summary-card" to="/intents">
        <span class="summary-value">{{ counts.intents }}</span>
        <span class="summary-label">意向队列 · 待跟进</span>
      </RouterLink>
      <RouterLink class="summary-card" to="/applies">
        <span class="summary-value">{{ counts.applies }}</span>
        <span class="summary-label">入驻队列 · 待审</span>
      </RouterLink>
      <RouterLink class="summary-card" to="/shelf-requests">
        <span class="summary-value">{{ counts.shelf }}</span>
        <span class="summary-label">上下架队列 · 待审</span>
      </RouterLink>
    </nav>
    <div class="page-head">
      <div>
        <h1>入驻申请</h1>
        <p class="hint">通过后开通商家账号并绑定主体。驳回须填写原因。</p>
      </div>
      <el-button type="primary" @click="router.push('/applies/new')">代商家录入</el-button>
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
      <el-button type="primary" size="small" native-type="submit">查询</el-button>
      <el-button text type="primary" @click="resetFilters">重置</el-button>
    </el-form>
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-empty v-else-if="!result?.items.length" :description="appliedStatus === 'PENDING' ? EMPTY_APPLIES : '没有符合条件的申请'">
      <el-button text @click="resetFilters">重置筛选</el-button>
    </el-empty>
    <template v-else>
      <div class="table-wrap">
        <el-table :data="result.items" row-key="id">
          <el-table-column label="主体" min-width="140">
            <template #default="{ row }">{{ orgLabel(row) }}</template>
          </el-table-column>
          <el-table-column prop="contactName" label="联系人" min-width="100" />
          <el-table-column prop="contactPhone" label="手机" min-width="130" />
          <el-table-column label="地区" min-width="100">
            <template #default="{ row }">{{ row.regionId ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="来源" width="90">
            <template #default="{ row }">
              <el-tag v-if="row.source === 'ADMIN'" type="warning" effect="plain">运营代录</el-tag>
              <el-tag v-else type="info" effect="plain">商家自填</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="提交时间" min-width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="reviewTagType(row.status)">{{ reviewStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <RouterLink :to="`/applies/${row.id}`">审核</RouterLink>
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
