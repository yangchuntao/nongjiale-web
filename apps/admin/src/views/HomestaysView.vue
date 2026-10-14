<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

type Row = {
  id: number
  name: string
  status: string
  priceFrom: number
  regionId: number
  version: number
}

const auth = useAuthStore()
const items = ref<Row[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const page = await api.fetchHomestays(auth.token!)
    items.value = page.items as Row[]
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function setStatus(row: Row, status: string) {
  if (!auth.isOperator) {
    ElMessage.warning('仅 OPERATOR 可改上下架')
    return
  }
  try {
    await api.updateHomestayStatus(auth.token!, row.id, { status, version: row.version })
    ElMessage.success('已更新')
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '更新失败')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2>房源</h2>
    <p style="color:#666">这里的上架/下架是运营代操作（POST /api/admin/homestays/{id}/status）。商家申请请到「上下架审核」。</p>
    <p v-if="!auth.isOperator" style="color:#b42318">当前角色非 OPERATOR，只能查看，不能改状态。</p>
    <el-table :data="items" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="regionId" label="地区" width="80" />
      <el-table-column prop="priceFrom" label="起步价" width="100" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button size="small" :disabled="!auth.isOperator" @click="setStatus(row, 'ON_SALE')">上架</el-button>
          <el-button size="small" :disabled="!auth.isOperator" @click="setStatus(row, 'OFF_SALE')">下架</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
