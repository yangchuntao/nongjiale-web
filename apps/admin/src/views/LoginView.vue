<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const username = ref('operator')
const password = ref('password')
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    router.replace((route.query.redirect as string) || '/')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center">
    <el-card style="width:380px">
      <h2>农家乐管理后台</h2>
      <p style="color:#666;font-size:13px">演示：operator / agent · password</p>
      <el-form @submit.prevent="submit">
        <el-form-item label="用户名">
          <el-input v-model="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" show-password />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width:100%">登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>
