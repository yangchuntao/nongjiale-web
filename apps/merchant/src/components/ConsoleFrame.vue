<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { appLabel } from '../env'
import { navItems } from '../router/nav'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const site = useSiteStore()
const navOpen = ref(false)

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
    <el-aside width="220px" class="aside console-aside">
      <div class="brand">
        <strong>{{ site.name }}</strong>
        <span>{{ appLabel }}</span>
      </div>
      <el-menu router :default-active="active" :key="active">
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
          {{ item.label }}
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="topbar" height="56px">
        <div class="topbar-start">
          <el-button class="nav-toggle" text aria-label="打开导航" @click="navOpen = true">菜单</el-button>
          <span>客服 {{ site.phone }}</span>
        </div>
        <div class="topbar-end">
          <span v-if="auth.displayName">{{ auth.displayName }}</span>
          <el-button v-if="auth.isAuthenticated" text @click="logout">退出</el-button>
          <RouterLink v-else to="/login">登录</RouterLink>
        </div>
      </el-header>
      <el-main>
        <RouterView />
      </el-main>
    </el-container>
    <el-drawer v-model="navOpen" direction="ltr" size="220px" title="导航">
      <el-menu router :default-active="active" @select="navOpen = false">
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
          {{ item.label }}
        </el-menu-item>
      </el-menu>
    </el-drawer>
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

.topbar,
.topbar-start,
.topbar-end {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.topbar {
  justify-content: space-between;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.el-main {
  max-width: var(--content-width);
}
</style>
