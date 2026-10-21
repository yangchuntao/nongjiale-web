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
  <header class="site-head">
    <div class="site-head__in">
      <RouterLink class="brandmark" to="/" aria-label="回到首页">
        <span class="brandmark__mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="brandmark__text">
          <b>{{ site.name }}</b>
          <span>水乡农家</span>
        </span>
      </RouterLink>

      <button
        class="nav-toggle"
        type="button"
        :aria-expanded="open"
        aria-controls="portal-nav"
        @click="open = !open"
      >
        {{ open ? '收起' : '菜单' }}
      </button>

      <nav id="portal-nav" class="site-nav" :class="{ open }" aria-label="主导航">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :class="{ 'is-active': isActive(link.to) }"
          :aria-current="isActive(link.to) ? 'page' : undefined"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="site-head__right">
        <a class="phone-link" :href="`tel:${site.phone.replace(/\s+/g, '')}`">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path
              d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"
              stroke-linejoin="round"
            />
          </svg>
          <span>客服 {{ site.phone }}</span>
        </a>
        <div class="account">
          <RouterLink :to="mineTo">我的</RouterLink>
          <button v-if="auth.isAuthenticated" type="button" @click="logout">退出</button>
          <template v-else>
            <RouterLink to="/login">登录</RouterLink>
            <RouterLink to="/register">注册</RouterLink>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>
