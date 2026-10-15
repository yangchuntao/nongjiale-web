<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const active = computed(() => {
  const path = route.path
  if (path.startsWith('/stores')) return '/stores'
  if (path.startsWith('/intents')) return '/intents'
  if (path.startsWith('/listing-applications')) return '/listing-applications'
  if (path.startsWith('/account')) return '/account'
  return '/'
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <el-container style="min-height:100vh">
    <el-aside width="210px" style="background:#3e2c22;color:#fff">
      <div style="padding:16px 16px 4px;font-weight:700;color:#f0c07a">商家中心</div>
      <div style="padding:0 16px 12px;font-size:12px;color:#e6d3c2">{{ auth.profile?.subjectName || '本主体' }}</div>
      <el-menu router :default-active="active" background-color="#3e2c22" text-color="#f3e6d8" active-text-color="#f0c07a">
        <el-menu-item index="/">工作台</el-menu-item>
        <el-menu-item index="/stores">门店</el-menu-item>
        <el-menu-item index="/listing-applications">上下架申请</el-menu-item>
        <el-menu-item index="/intents">意向（只读）</el-menu-item>
        <el-menu-item index="/account">账号</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="display:flex;align-items:center;justify-content:flex-end;gap:12px;background:#fff;border-bottom:1px solid #eee">
        <span>{{ auth.profile?.phone }}</span>
        <el-button link type="danger" @click="logout">退出</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
