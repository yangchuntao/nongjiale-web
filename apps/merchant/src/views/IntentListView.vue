<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchMerchantIntents } from '../api/merchant'
import {
  displayContactPhone,
  guestLabel,
  intentDateLabel,
  intentStatusLabel,
  intentTagType,
  type IntentRecord,
} from '../api/readers'
import { EMPTY_INTENTS, MERCHANT_INTENT_NOTICE } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const result = ref<PageResult<IntentRecord> | null>(null)

const page = computed(() => {
  const raw = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
  const value = Number(raw || '1')
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
})

async function load() {
  const outcome = await run((signal) => fetchMerchantIntents(page.value, signal))
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') {
    result.value = null
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

function changePage(next: number) {
  void router.push(next <= 1 ? '/intents' : { path: '/intents', query: { page: String(next) } })
}

watch(page, () => void load(), { immediate: true })
</script>

<template>
  <section class="page">
    <h1>本店意向</h1>
    <el-alert :title="MERCHANT_INTENT_NOTICE" type="info" :closable="false" show-icon />
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
          <el-table-column label="日期" min-width="180">
            <template #default="{ row }">{{ intentDateLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="人数" width="90">
            <template #default="{ row }">{{ guestLabel(row.guests) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="intentTagType(row.status)">{{ intentStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="联系人" min-width="120">
            <template #default="{ row }">{{ row.contactName || '—' }}</template>
          </el-table-column>
          <el-table-column label="手机" min-width="140">
            <template #default="{ row }">{{ displayContactPhone(row.contactPhone) || '—' }}</template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination
        v-if="result.total > result.pageSize"
        layout="prev, pager, next"
        :total="result.total"
        :page-size="result.pageSize"
        :current-page="result.page || page"
        @current-change="changePage"
      />
    </template>
  </section>
</template>
