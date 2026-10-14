<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { AdminIntent } from '@nongjiale/shared'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const detail = ref<AdminIntent | null>(null)
const status = ref('CONFIRMED')
const note = ref('')
const saving = ref(false)

async function load() {
  detail.value = await api.fetchIntent(auth.token!, route.params.id as string)
}

async function save() {
  if (!detail.value) return
  saving.value = true
  try {
    detail.value = await api.updateIntentStatus(auth.token!, detail.value.id, {
      status: status.value,
      version: detail.value.version,
      note: note.value || undefined,
    })
    ElMessage.success('已更新')
    note.value = ''
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '更新失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  }
})
</script>

<template>
  <div v-if="detail">
    <h2>意向 {{ detail.intentNo }}</h2>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
      <el-descriptions-item label="房源 ID">{{ detail.homestayId }}</el-descriptions-item>
      <el-descriptions-item label="人数">{{ detail.guests }}</el-descriptions-item>
      <el-descriptions-item label="入住">{{ detail.checkIn }}</el-descriptions-item>
      <el-descriptions-item label="离店">{{ detail.checkOut }}</el-descriptions-item>
      <el-descriptions-item label="联系人">{{ detail.contactName }}</el-descriptions-item>
      <el-descriptions-item label="电话">{{ detail.contactPhone }}</el-descriptions-item>
      <el-descriptions-item label="version">{{ detail.version }}</el-descriptions-item>
      <el-descriptions-item label="创建">{{ detail.createdAt }}</el-descriptions-item>
    </el-descriptions>

    <el-card style="margin-top:16px" header="改状态（POST /status，非 PATCH）">
      <el-form inline>
        <el-form-item label="目标状态">
          <el-select v-model="status" style="width:160px">
            <el-option label="CONFIRMED" value="CONFIRMED" />
            <el-option label="RESCHEDULED" value="RESCHEDULED" />
            <el-option label="CLOSED" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="note" placeholder="可选" />
        </el-form-item>
        <el-button type="primary" :loading="saving" @click="save">提交</el-button>
      </el-form>
    </el-card>

    <el-card style="margin-top:16px" header="备注时间线">
      <el-timeline v-if="detail.notes?.length">
        <el-timeline-item v-for="n in detail.notes" :key="n.id" :timestamp="n.createdAt">
          {{ n.action }} · {{ n.note || '（无备注）' }}
        </el-timeline-item>
      </el-timeline>
      <p v-else style="color:#666">暂无备注</p>
    </el-card>
  </div>
</template>
