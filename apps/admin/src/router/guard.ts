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
    const guideId = to.name === 'guides' && typeof to.params.id === 'string' ? to.params.id : ''
    pageTitle = String(guideId === 'new' ? '新建攻略' : guideId ? '攻略编辑' : to.meta.title || '运营端')
    if (typeof document !== 'undefined') {
      document.title = `${pageTitle} · ${useSiteStore().name}`
    }
  })
}

/** 页面标题见文件顶部声明 */
