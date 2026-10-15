<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { AdminHomestayRow } from '../api'
import * as api from '../api'
import { ApiError } from '../utils/http'
import { useAuthStore } from '../stores/auth'

type Row = AdminHomestayRow & {
  recommendKnown: boolean
  sortKnown: boolean
}

const auth = useAuthStore()
const items = ref<Row[]>([])
const loading = ref(false)
const error = ref('')
const savingId = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const page = await api.fetchHomestays(auth.token!)
    const rows = Array.isArray(page?.items) ? page.items : []
    items.value = rows.map((row) => ({
      ...row,
      homeRecommended: row.homeRecommended === true,
      homeRecommendSort: typeof row.homeRecommendSort === 'number' ? row.homeRecommendSort : 0,
      recommendKnown: typeof row.homeRecommended === 'boolean',
      sortKnown: typeof row.homeRecommendSort === 'number',
    }))
  } catch (e) {
    items.value = []
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function setStatus(row: Row, status: string) {
  if (!auth.isOperator) return
  try {
    await api.updateHomestayStatus(auth.token!, row.id, { status, version: row.version })
    ElMessage.success('已更新')
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '更新失败')
  }
}

async function saveRecommend(row: Row) {
  if (!auth.isOperator) return
  savingId.value = row.id
  try {
    await api.updateHomestayRecommend(auth.token!, row.id, {
      homeRecommended: row.homeRecommended === true,
      homeRecommendSort: Number(row.homeRecommendSort) || 0,
      version: row.version,
    })
    ElMessage.success('首页推荐已保存')
    await load()
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 409) {
      ElMessage.error(e.message || '数据已更新，请刷新')
      await load()
    } else if (e instanceof ApiError && e.httpStatus === 403) {
      ElMessage.error(e.message || '无权限')
    } else {
      ElMessage.error(e instanceof Error ? e.message : '保存失败')
    }
  } finally {
    savingId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2>房源</h2>
    <p style="color:#666">上架/下架是运营代操作。首页推荐写在房源上，没有单独的推荐位页面。客服只能看。</p>
    <p v-if="!auth.isOperator" style="color:#b42318">当前是客服，不能改上下架，也不能改首页推荐。</p>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:12px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-table :data="items" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="regionId" label="地区" width="80" />
      <el-table-column prop="priceFrom" label="起步价" width="90" />
      <el-table-column prop="status" label="状态" width="110" />
      <el-table-column label="首页推荐" width="120">
        <template #default="{ row }">
          <template v-if="auth.isOperator">
            <el-checkbox v-model="row.homeRecommended">推荐</el-checkbox>
            <div v-if="!row.recommendKnown" style="color:#999;font-size:12px">列表未返回</div>
          </template>
          <span v-else>{{ row.recommendKnown ? (row.homeRecommended ? '是' : '否') : '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="推荐排序" width="150">
        <template #default="{ row }">
          <el-input-number v-if="auth.isOperator" v-model="row.homeRecommendSort" :step="1" controls-position="right" />
          <span v-else>{{ row.sortKnown ? row.homeRecommendSort : '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <template v-if="auth.isOperator">
            <el-button size="small" @click="setStatus(row, 'ON_SALE')">上架</el-button>
            <el-button size="small" @click="setStatus(row, 'OFF_SALE')">下架</el-button>
            <el-button size="small" type="primary" :loading="savingId === row.id" @click="saveRecommend(row)">保存推荐</el-button>
          </template>
          <span v-else style="color:#999">只读</span>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无房源" />
      </template>
    </el-table>
  </div>
</template>
