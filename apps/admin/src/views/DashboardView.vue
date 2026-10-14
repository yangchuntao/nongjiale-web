<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const pendingIntents = ref(0)
const pendingMessages = ref(0)

onMounted(async () => {
  try {
    const data = await api.fetchDashboard(auth.token!)
    pendingIntents.value = data.pendingIntents
    pendingMessages.value = data.pendingMessages
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  }
})
</script>

<template>
  <div>
    <h2>仪表盘</h2>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card>
          <div>待跟进意向</div>
          <div style="font-size:28px;font-weight:700">{{ pendingIntents }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div>待处理留言</div>
          <div style="font-size:28px;font-weight:700">{{ pendingMessages }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
