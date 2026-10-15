<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const site = useSiteStore()

const links = [
  { to: '/', label: '首页' },
  { to: '/listings', label: '房源' },
  { to: '/guides', label: '攻略' },
  { to: '/my/intents', label: '我的意向' },
  { to: '/merchant/apply', label: '入驻申请' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function logout() {
  auth.logout()
  await router.push('/login')
}
</script>

<template>
  <header class="header">
    <RouterLink class="brand" to="/">{{ site.name }}</RouterLink>
    <nav>
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :class="{ active: isActive(link.to) }"
      >
        {{ link.label }}
      </RouterLink>
    </nav>
    <div class="account">
      <button v-if="auth.isAuthenticated" type="button" @click="logout">退出</button>
      <template v-else>
        <RouterLink to="/login">登录</RouterLink>
        <RouterLink to="/register">注册</RouterLink>
      </template>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  color: var(--color-brand);
  font-size: var(--font-h3);
  font-weight: 600;
  text-decoration: none;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  flex: 1;
}

nav a,
.account a,
.account button {
  color: var(--color-text);
  font-size: var(--font-body);
  text-decoration: none;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font: inherit;
}

nav a.active {
  color: var(--color-brand);
}

.account {
  display: flex;
  gap: var(--space-3);
}
</style>
