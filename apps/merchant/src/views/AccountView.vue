<script setup lang="ts">
import { useRouter } from 'vue-router'
import PasswordForm from '../components/PasswordForm.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
</script>

<template>
  <div style="max-width:520px">
    <h2>账号</h2>
    <el-descriptions :column="1" border style="margin-bottom:20px">
      <el-descriptions-item label="主体">{{ auth.profile?.subjectName || '—' }}</el-descriptions-item>
      <el-descriptions-item label="主体编号">{{ auth.profile?.merchantId ?? '—' }}</el-descriptions-item>
      <el-descriptions-item label="登录手机">{{ auth.profile?.phone || '—' }}</el-descriptions-item>
      <el-descriptions-item label="角色">{{ auth.profile?.role || 'MERCHANT' }}</el-descriptions-item>
    </el-descriptions>
    <h3>修改密码</h3>
    <PasswordForm @success="router.push('/')" />
  </div>
</template>
