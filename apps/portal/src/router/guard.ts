import type { Router } from 'vue-router'
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

  router.afterEach((to) => {
    if (typeof document === 'undefined') return
    const site = useSiteStore()
    const title = to.meta.title || '页面'
    document.title = `${title} · ${site.name}`
  })
}
