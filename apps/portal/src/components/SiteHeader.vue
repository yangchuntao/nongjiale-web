<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const site = useSiteStore()
const open = ref(false)

const links = [
  { to: '/', label: '首页' },
  { to: '/listings', label: '找农家乐' },
  { to: '/guides', label: '攻略' },
]

const mineTo = computed(() =>
  auth.isAuthenticated ? '/my/intents' : { path: '/login', query: { redirect: '/my/intents' } },
)

watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)

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
    <div class="bar">
      <RouterLink class="brand" to="/">{{ site.name }}</RouterLink>
      <button class="nav-toggle" type="button" :aria-expanded="open" aria-controls="portal-nav" @click="open = !open">
        菜单
      </button>
      <a class="phone" :href="`tel:${site.phone.replace(/\s+/g, '')}`">客服 {{ site.phone }}</a>
      <div class="account">
        <RouterLink :to="mineTo">我的</RouterLink>
        <button v-if="auth.isAuthenticated" type="button" @click="logout">退出</button>
        <template v-else>
          <RouterLink to="/login">登录</RouterLink>
          <RouterLink to="/register">注册</RouterLink>
        </template>
      </div>
    </div>
    <nav id="portal-nav" :class="{ open }">
      <RouterLink v-for="link in links" :key="link.to" :to="link.to" :class="{ active: isActive(link.to) }">
        {{ link.label }}
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.bar,
nav,
.account {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.bar {
  flex-wrap: wrap;
  padding: var(--space-4) var(--space-5) var(--space-3);
}

.brand {
  color: var(--color-brand);
  font-size: var(--font-h3);
  font-weight: 600;
  text-decoration: none;
  margin-right: auto;
}

nav {
  flex-wrap: wrap;
  padding: 0 var(--space-5) var(--space-4);
}

nav a,
.account a,
.account button,
.phone,
.nav-toggle {
  color: var(--color-text);
  font-size: var(--font-body);
  text-decoration: none;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font: inherit;
}

nav a.active,
.brand:hover,
.phone:hover {
  color: var(--color-brand);
}

.nav-toggle {
  display: none;
}

@media (max-width: 767px) {
  .nav-toggle {
    display: inline-flex;
  }

  nav {
    display: none;
  }

  nav.open {
    display: flex;
  }
}
</style>
