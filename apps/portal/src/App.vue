<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import { useConfigStore } from './stores/config'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const config = useConfigStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <router-link to="/" class="brand">农家乐 · 长三角</router-link>
      <nav class="nav">
        <router-link to="/search">找民宿</router-link>
        <a v-if="config.contactPhone" :href="`tel:${config.contactPhone}`">客服 {{ config.contactPhone }}</a>
        <template v-if="auth.isLoggedIn">
          <span class="user">{{ auth.user?.displayName || auth.user?.phone }}</span>
          <button type="button" class="linkish" @click="logout">退出</button>
        </template>
        <router-link v-else to="/login">登录</router-link>
      </nav>
    </header>
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      意向预订 · 无在线支付 · 客服确认后入住
    </footer>
  </div>
</template>
