import type { Router } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'

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

  // 站名来自异步的公开配置，首次路由时可能还是占位——跟随变化补写标题
  let pageTitle = ''
  const applyTitle = () => {
    if (typeof document !== 'undefined' && pageTitle) {
      document.title = `${pageTitle} · ${useSiteStore().name}`
    }
  }
  router.afterEach((to) => {
    const guideId = to.name === 'guides' && typeof to.params.id === 'string' ? to.params.id : ''
    pageTitle = String(guideId === 'new' ? '新建攻略' : guideId ? '攻略编辑' : to.meta.title || '运营端')
    applyTitle()
  })
  watch(() => useSiteStore().name, applyTitle)
}
