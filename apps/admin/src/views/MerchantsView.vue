<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { MerchantAccount } from '@nongjiale/shared'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const items = ref<MerchantAccount[]>([])
const total = ref(0)
const page = ref(1)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.fetchMerchants(auth.token!, page.value, 20)
    items.value = Array.isArray(data?.items) ? data.items : []
    total.value = typeof data?.total === 'number' ? data.total : items.value.length
  } catch (e) {
    items.value = []
    total.value = 0
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function toggle(row: MerchantAccount) {
  const next = !row.enabled
  try {
    await ElMessageBox.confirm(next ? `启用「${row.subjectName}」？` : `停用「${row.subjectName}」？停用后商家登录会失败。`, '商家账号')
  } catch {
    return
  }
  try {
    await api.setMerchantEnabled(auth.token!, row.merchantId, next)
    ElMessage.success(next ? '已启用' : '已停用')
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '更新失败')
  }
}

async function resetPassword(row: MerchantAccount) {
  try {
    await ElMessageBox.confirm(`重置「${row.subjectName}」的密码？新密码只显示一次，商家下次登录必须改密。`, '重置密码')
  } catch {
    return
  }
  try {
    const data = await api.resetMerchantPassword(auth.token!, row.merchantId)
    if (!data?.initialPassword) {
      ElMessage.warning('已重置，但响应没有返回初始密码')
      return
    }
    await ElMessageBox.alert(
      `登录手机：${row.loginPhone}\n初始密码：${data.initialPassword}\n请线下告知商家。此密码不会出现在列表里。`,
      '密码已重置',
    )
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '重置失败')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2>商家账号</h2>
    <p style="color:#666">入驻通过后在这里启用、停用或重置密码。客服没有入口。</p>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:12px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-table :data="items" v-loading="loading" stripe>
      <el-table-column prop="merchantId" label="编号" width="90" />
      <el-table-column prop="subjectName" label="主体" />
      <el-table-column prop="loginPhone" label="登录手机" width="150" />
      <el-table-column prop="storeCount" label="门店数" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">{{ row.enabled ? '启用' : '停用' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button size="small" @click="toggle(row)">{{ row.enabled ? '停用' : '启用' }}</el-button>
          <el-button size="small" @click="resetPassword(row)">重置密码</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无商家账号" />
      </template>
    </el-table>
    <div v-if="total > 20" style="margin-top:12px;display:flex;justify-content:flex-end">
      <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="20" v-model:current-page="page" @current-change="load" />
    </div>
  </div>
</template>
