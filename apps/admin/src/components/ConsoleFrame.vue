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

/* 导航分组：只影响展示层级，不改变路由表 */
const GROUPS: { name: string; paths: string[] }[] = [
  { name: '内容与货架', paths: ['/applies', '/merchants', '/listings', '/shelf-requests'] },
  { name: '咨询与内容', paths: ['/intents', '/guides', '/banners'] },
  { name: '站点与数据', paths: ['/cities', '/seed-metrics', '/site'] },
]

const groups = computed(() =>
  GROUPS.map((group) => ({
    name: group.name,
    items: group.paths
      .map((path) => navItems.find((item) => item.path === path))
      .filter((item): item is (typeof navItems)[number] => Boolean(item)),
  })).filter((group) => group.items.length),
)

const active = computed(() => {
  const match = [...navItems]
    .reverse()
    .find((item) => route.path === item.path || route.path.startsWith(`${item.path}/`))
  return match?.path ?? route.path
})

const crumb = computed(() => navItems.find((item) => item.path === active.value)?.label ?? '运营后台')
const initial = computed(() => (auth.displayName || site.name || '运').slice(0, 1))
const groupNames = computed(() => groups.value.map((group) => group.name))

async function logout() {
  auth.logout()
  await router.push('/login')
}
</script>

<template>
  <el-container class="console shell">
    <el-aside width="236px" class="aside console-aside side">
      <div class="side__brand">
        <div class="brand-row">
          <span class="side-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <div class="brand-text">
            <div class="name">{{ site.name }}</div>
            <div class="sub">水乡农家</div>
          </div>
        </div>
        <div class="role">OPS CONSOLE · {{ appLabel }}</div>
      </div>
      <el-menu
        router
        :default-active="active"
        :default-openeds="groupNames"
        class="side__nav"
        aria-label="运营后台主导航"
      >
        <el-sub-menu v-for="group in groups" :key="group.name" :index="group.name">
          <template #title>
            <span class="group-title">{{ group.name }}</span>
          </template>
          <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path">
            {{ item.label }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
      <div class="side__foot">
        <span class="avatar" aria-hidden="true">{{ initial }}</span>
        <div class="who">
          <b>{{ auth.displayName || '未登录' }}</b>
          <span>运营</span>
        </div>
      </div>
    </el-aside>

    <el-container class="main">
      <el-header class="topbar" height="68px">
        <el-button class="nav-toggle" text aria-label="打开导航" @click="navOpen = true">菜单</el-button>
        <nav class="crumb" aria-label="面包屑">
          <span>运营后台</span>
          <span class="sep" aria-hidden="true">/</span>
          <span class="now">{{ crumb }}</span>
        </nav>
        <div class="topbar__right">
          <a v-if="site.phone" class="phone-link" :href="`tel:${site.phone.replace(/\s+/g, '')}`">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path
                d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>客服 {{ site.phone }}</span>
          </a>
          <div v-if="auth.isAuthenticated" class="who">
            <span class="avatar" aria-hidden="true">{{ initial }}</span>
            <span>{{ auth.displayName || '运营' }}</span>
            <el-button text @click="logout">退出</el-button>
          </div>
          <RouterLink v-else to="/login">登录</RouterLink>
        </div>
      </el-header>
      <el-main class="content">
        <RouterView />
      </el-main>
    </el-container>

    <el-drawer v-model="navOpen" direction="ltr" size="236px" title="导航">
      <el-menu router :default-active="active" :default-openeds="groupNames" @select="navOpen = false">
        <el-sub-menu v-for="group in groups" :key="group.name" :index="group.name">
          <template #title>
            <span class="group-title">{{ group.name }}</span>
          </template>
          <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path">
            {{ item.label }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-drawer>
  </el-container>
</template>

<style scoped>
.console {
  min-height: 100svh;
  background: var(--paper);
}

.aside {
  background: var(--paper-sunk);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100svh;
  overflow-y: auto;
  padding: 0;
}

.side__brand {
  padding: var(--space-5) var(--space-4) var(--space-4);
  border-bottom: 1px solid var(--line);
}

/* 垛田方标：四块田，呼应「垛」字 */
.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.side-mark {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 3px;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
}

.side-mark i {
  border-radius: 2px;
  background: var(--brand-600);
}

.side-mark i:nth-child(2) {
  background: var(--brand-400);
}

.side-mark i:nth-child(3) {
  background: var(--brand-500);
}

.side-mark i:nth-child(4) {
  background: var(--gold-500);
}

.brand-text {
  min-width: 0;
  line-height: 1.15;
}

.side__brand .name {
  font-family: var(--font-serif);
  font-size: 21px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.01em;
  color: var(--ink-900);
}

.side__brand .sub {
  margin-top: 3px;
  font-size: 10px;
  letter-spacing: 0.28em;
  color: var(--ink-400);
}

.side__brand .role {
  margin-top: var(--space-3);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--ink-400);
}

.side__nav {
  flex: 1;
  padding: var(--space-2);
}

.side__foot {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-top: 1px solid var(--line);
}

.side__foot .who,
.topbar .who {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  font-size: var(--font-caption);
  color: var(--ink-600);
}

.side__foot .who {
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.side__foot .who b {
  font-size: var(--font-body);
  font-weight: var(--font-weight-semibold);
  color: var(--ink-900);
}

.side__foot .who span {
  font-size: 11px;
  color: var(--ink-400);
}

.avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--brand-100);
  color: var(--brand-700);
  font-family: var(--font-serif);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
}

.main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-6);
  background: color-mix(in oklab, var(--paper) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.crumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-caption);
  color: var(--ink-400);
}

.crumb .sep {
  opacity: 0.5;
}

.crumb .now {
  color: var(--ink-900);
  font-weight: 500;
}

.topbar__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.phone-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: var(--font-caption);
  color: var(--ink-600);
  font-variant-numeric: tabular-nums;
}

.phone-link svg {
  width: 15px;
  height: 15px;
  color: var(--brand-600);
  flex-shrink: 0;
}

.content {
  flex: 1;
  padding: var(--space-6);
  max-width: none;
}

@media (max-width: 1024px) {
  .content {
    padding: var(--space-4);
  }
}
</style>
