import type { Router } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'

/** 当前页面标题（不含站名后缀），供 main.ts 在站名异步到达后重写 document.title */
let pageTitle = ''
export function currentPageTitle(): string {
  return pageTitle
}

export function safeInternalPath(value: unknown, fallback: string): string {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return fallback
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return fallback
  const pathOnly = raw.split('?')[0] ?? raw
  if (pathOnly === '/login' || pathOnly === '/register') return fallback
  return raw
}

export function installAuthGuard(router: Router, homePath: string) {
  router.beforeEach((to) => {
    const auth = useAuthStore()
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return safeInternalPath(to.query.redirect, homePath)
    }
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }
    return true
  })

  // 站名来自异步公开配置；标题跟随站名的重写由 main.ts 的 watch 完成（pinia 就绪后注册）
  router.afterEach((to) => {
    pageTitle = String(to.meta.title || '商家端')
    if (typeof document !== 'undefined') {
      document.title = `${pageTitle} · ${useSiteStore().name}`
    }
  })
}
