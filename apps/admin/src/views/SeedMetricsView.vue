<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { exportCityIntents, fetchCities, fetchCityIntents } from '../api/admin'
import { describeAdminError } from '../api/errors'
import {
  cityIntentCities,
  cityIntentTotal,
  type CityIntentMetrics,
  type CityIntentWindow,
  type CitySummary,
} from '../api/readers'
import { SEED_EMPTY, SEED_ERROR, SEED_NOTICE } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const metrics = ref<CityIntentMetrics | null>(null)
const cities = ref<CitySummary[]>([])
const timeWindow = ref<CityIntentWindow>('7')
const cityId = ref('')
const exporting = ref(false)

const filter = computed(() => ({ window: timeWindow.value, cityId: cityId.value }))
const total = computed(() => (metrics.value ? cityIntentTotal(metrics.value) : null))
const rows = computed(() => (metrics.value ? cityIntentCities(metrics.value) : []))
const quiet = computed(
  () => !!total.value && total.value.intentCount === 0 && total.value.confirmedCount === 0 && total.value.checkedInCount === 0,
)

async function load() {
  const outcome = await run((signal) => fetchCityIntents(filter.value, signal))
  if (outcome.status === 'ok') metrics.value = outcome.data
  if (outcome.status === 'error') {
    metrics.value = null
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

function downloadCsv(filename: string, content: string) {
  const text = content.charCodeAt(0) === 0xfeff ? content : `\uFEFF${content}`
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
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
    const csv = await exportCityIntents(filter.value)
    downloadCsv('city-intents.csv', csv)
    ElMessage.success('已导出当前筛选结果')
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    ElMessage.error(view.message)
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  void fetchCities()
    .then((items) => {
      cities.value = items
    })
    .catch(() => {
      cities.value = []
    })
})

watch(filter, () => void load(), { immediate: true })
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>种子看板</h1>
        <p class="notice">{{ SEED_NOTICE }}</p>
      </div>
      <el-button :loading="exporting" @click="onExport">导出</el-button>
    </div>
    <el-form class="filters" @submit.prevent>
      <el-form-item label="时间窗">
        <el-radio-group v-model="timeWindow">
          <el-radio-button label="7">近 7 天</el-radio-button>
          <el-radio-button label="30">近 30 天</el-radio-button>
          <el-radio-button label="ALL">全部</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="市">
        <el-select v-model="cityId" style="width: 12rem">
          <el-option label="全部" value="" />
          <el-option v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="errorKind === 'generic' ? SEED_ERROR : error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <template v-else-if="total">
      <p v-if="metrics?.from" class="hint">统计自 {{ metrics.from }}</p>
      <p v-if="quiet" class="hint">{{ SEED_EMPTY }}</p>
      <div class="summary-grid" aria-label="合计">
        <article class="summary-card">
          <span class="summary-value">{{ total.intentCount }}</span>
          <span class="summary-label">意向数</span>
        </article>
        <article class="summary-card">
          <span class="summary-value">{{ total.confirmedCount }}</span>
          <span class="summary-label">已确认</span>
        </article>
        <article class="summary-card">
          <span class="summary-value">{{ total.checkedInCount }}</span>
          <span class="summary-label">已入住</span>
        </article>
      </div>
      <div v-if="rows.length" class="table-wrap">
        <el-table :data="rows" row-key="cityId">
          <el-table-column prop="cityName" label="市名" min-width="140" />
          <el-table-column prop="intentCount" label="意向数" min-width="100" />
          <el-table-column prop="confirmedCount" label="已确认" min-width="100" />
          <el-table-column prop="checkedInCount" label="已入住" min-width="100" />
        </el-table>
      </div>
    </template>
  </section>
</template>
