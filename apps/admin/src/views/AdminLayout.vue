<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <el-container style="min-height:100vh">
    <el-aside width="200px" style="background:#1f2a1f;color:#fff">
      <div style="padding:16px;font-weight:700">农家乐后台</div>
      <el-menu router background-color="#1f2a1f" text-color="#ddd" active-text-color="#95d5a0" :default-active="$route.path">
        <el-menu-item index="/">工作台</el-menu-item>
        <el-menu-item index="/intents">意向单</el-menu-item>
        <el-menu-item index="/homestays">房源</el-menu-item>
        <el-menu-item v-if="auth.isOperator" index="/merchant-applications">入驻审核</el-menu-item>
        <el-menu-item v-if="auth.isOperator" index="/listing-applications">上下架审核</el-menu-item>
        <el-menu-item v-if="auth.isOperator" index="/articles">资讯</el-menu-item>
        <el-menu-item v-if="auth.isOperator" index="/merchants">商家账号</el-menu-item>
        <el-menu-item v-if="auth.isOperator" index="/site-config">站点配置</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="display:flex;align-items:center;justify-content:flex-end;gap:12px;background:#fff;border-bottom:1px solid #eee">
        <span>{{ auth.profile?.displayName }}（{{ auth.profile?.role }}）</span>
        <el-button link type="danger" @click="logout">退出</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
