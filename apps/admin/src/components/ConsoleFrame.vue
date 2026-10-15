<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { appLabel } from '../env'
import { navItems } from '../router/nav'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const site = useSiteStore()

const active = computed(() => {
  const match = [...navItems]
    .reverse()
    .find((item) => route.path === item.path || route.path.startsWith(`${item.path}/`))
  return match?.path ?? route.path
})

async function logout() {
  auth.logout()
  await router.push('/login')
}
</script>

<template>
  <el-container class="console">
    <el-aside width="220px" class="aside">
      <div class="brand">
        <strong>{{ site.name }}</strong>
        <span>{{ appLabel }} · 「脚手架」</span>
      </div>
      <el-menu router :default-active="active">
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
          {{ item.label }}
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="topbar" height="56px">
        <span>客服 {{ site.phone }}</span>
        <el-button v-if="auth.isAuthenticated" text @click="logout">退出</el-button>
        <RouterLink v-else to="/login">登录</RouterLink>
      </el-header>
      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.console {
  min-height: 100svh;
}

.aside {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

.brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
}

.brand strong {
  font-size: var(--font-h3);
}

.brand span,
.topbar {
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.el-main {
  max-width: var(--content-width);
}
</style>
