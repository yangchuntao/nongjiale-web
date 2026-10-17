<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { fetchCities } from '../api/admin'
import {
  cityTitle,
  cityUpdatedLabel,
  filterCities,
  openStatusLabel,
  type CitySummary,
} from '../api/readers'
import { CITY_LIST_EMPTY, CITY_LIST_ERROR, CITY_UNIT_HINT } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const cities = ref<CitySummary[]>([])
const status = ref('')
const province = ref('')
const keyword = ref('')

const provinces = computed(() => {
  const names = new Set<string>()
  for (const city of cities.value) {
    if (city.provinceName) names.add(city.provinceName)
  }
  return [...names]
})

const shown = computed(() =>
  filterCities(cities.value, {
    status: status.value,
    province: province.value,
    keyword: keyword.value,
  }),
)

async function load() {
  const outcome = await run((signal) => fetchCities(signal))
  if (outcome.status === 'ok') cities.value = outcome.data
  if (outcome.status === 'error') {
    cities.value = []
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

function resetFilters() {
  status.value = ''
  province.value = ''
  keyword.value = ''
}

watch(provinces, (names) => {
  if (province.value && !names.includes(province.value)) province.value = ''
})

void load()
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>开城/目的地</h1>
        <p class="hint">{{ CITY_UNIT_HINT }}</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>
    <el-form class="filters" @submit.prevent>
      <el-form-item label="状态">
        <el-select v-model="status" clearable placeholder="全部" style="width: 8rem">
          <el-option label="已开通" value="OPEN" />
          <el-option label="未开通" value="CLOSED" />
        </el-select>
      </el-form-item>
      <el-form-item label="省">
        <el-select v-model="province" clearable placeholder="全部" style="width: 10rem">
          <el-option v-for="name in provinces" :key="name" :label="name" :value="name" />
        </el-select>
      </el-form-item>
      <el-form-item label="市名">
        <el-input v-model="keyword" clearable placeholder="搜索市名" style="width: 12rem" />
      </el-form-item>
      <el-button text type="primary" @click="resetFilters">重置</el-button>
    </el-form>
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="errorKind === 'generic' ? CITY_LIST_ERROR : error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-empty v-else-if="!cities.length" :description="CITY_LIST_EMPTY" />
    <el-empty v-else-if="!shown.length" description="没有符合条件的目的地">
      <el-button text @click="resetFilters">重置筛选</el-button>
    </el-empty>
    <div v-else class="table-wrap">
      <el-table :data="shown" row-key="id">
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
  </section>
</template>
