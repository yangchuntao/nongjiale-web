<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useConfigStore } from './stores/config'

const auth = useAuthStore()
const config = useConfigStore()
const router = useRouter()
const keyword = ref('')

function logout() {
  auth.logout()
  router.push('/')
}

function search() {
  const q = keyword.value.trim()
  router.push({ path: '/search', query: q ? { q } : {} })
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <router-link to="/" class="brand">{{ config.siteName }}</router-link>
      <form class="nav-search" @submit.prevent="search">
        <input v-model="keyword" aria-label="搜索农家乐" placeholder="搜索农家乐" />
      </form>
      <nav class="nav">
        <router-link to="/">首页</router-link>
        <router-link to="/search">地区</router-link>
        <router-link to="/articles">攻略/资讯</router-link>
        <router-link to="/me/intents">我的意向</router-link>
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
      <a v-if="config.contactPhone" :href="`tel:${config.contactPhone}`">客服 {{ config.contactPhone }}</a>
      · <router-link to="/merchant/apply">商家入驻</router-link>
      · 意向预订，无在线支付
    </footer>
  </div>
</template>
