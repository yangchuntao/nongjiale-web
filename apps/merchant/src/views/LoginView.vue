<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const phone = ref('')
const password = ref('')
const loading = ref(false)

async function submit() {
  if (!phone.value.trim() || !password.value) {
    ElMessage.warning('请填写手机号和密码')
    return
  }
  loading.value = true
  try {
    await auth.login(phone.value.trim(), password.value)
    if (auth.mustChangePassword) {
      router.replace({ name: 'change-password' })
      return
    }
    router.replace((route.query.redirect as string) || '/')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f6f1ea">
    <el-card style="width:400px">
      <p style="margin:0 0 4px;color:#8a5a2b;font-weight:700">商家中心</p>
      <h2 style="margin:0 0 8px">商家登录</h2>
      <p style="color:#666;font-size:13px">与运营后台账号隔离。演示账号将在后端 v1.1 实现后由种子提供，此处不预置密码。</p>
      <el-form @submit.prevent="submit">
        <el-form-item label="手机号">
          <el-input v-model="phone" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width:100%">登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>
