<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { AdminIntent } from '@nongjiale/shared'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const items = ref<AdminIntent[]>([])
const total = ref(0)
const status = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const page = await api.fetchIntents(auth.token!, { status: status.value || undefined })
    items.value = page.items
    total.value = page.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h2 style="margin:0">意向单</h2>
      <el-select v-model="status" clearable placeholder="状态" style="width:160px" @change="load">
        <el-option label="全部" value="" />
        <el-option label="PENDING" value="PENDING" />
        <el-option label="CONFIRMED" value="CONFIRMED" />
        <el-option label="RESCHEDULED" value="RESCHEDULED" />
        <el-option label="CLOSED" value="CLOSED" />
      </el-select>
    </div>
    <el-table :data="items" v-loading="loading" stripe @row-click="(row: AdminIntent) => router.push(`/intents/${row.id}`)">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="intentNo" label="编号" width="160" />
      <el-table-column prop="homestayId" label="房源" width="80" />
      <el-table-column prop="contactName" label="联系人" />
      <el-table-column prop="contactPhone" label="电话" width="130" />
      <el-table-column prop="checkIn" label="入住" width="120" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="createdAt" label="创建时间" width="180" />
    </el-table>
    <p style="color:#666;margin-top:8px">共 {{ total }} 条 · 点击行查看详情</p>
  </div>
</template>
