<script setup lang="ts">
import { useRouter } from 'vue-router'
import PasswordForm from '../components/PasswordForm.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.replace('/login')
}

function onSuccess() {
  router.replace('/')
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f6f1ea">
    <el-card style="width:440px">
      <p style="margin:0;color:#8a5a2b;font-weight:700">商家中心</p>
      <h2>请先修改初始密码</h2>
      <p style="color:#666">运营开通或重置密码后，需先改密才能维护门店。改密完成前其他商家接口会被拒绝。</p>
      <PasswordForm @success="onSuccess" />
      <el-button link type="danger" style="margin-top:12px" @click="logout">退出登录</el-button>
    </el-card>
  </div>
</template>
