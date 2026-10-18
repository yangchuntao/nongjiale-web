import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { installAuthGuard } from './guard'
import { navItems } from './nav'
import { HOME_PATH, routes } from './routes'

function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  installAuthGuard(router, HOME_PATH)
  return router
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('admin routes', () => {
  it('sends anonymous operators to login and keeps the redirect', async () => {
    const router = createTestRouter()
    await router.push('/intents/9')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/intents/9')
  })

  it('bounces an authenticated operator off login', async () => {
    useAuthStore().setToken('admin-token')
    const router = createTestRouter()
    await router.push({ path: '/login', query: { redirect: '/site' } })
    expect(router.currentRoute.value.path).toBe('/site')
  })

  it('uses /guides/:id? for the list and the edit shell', async () => {
    useAuthStore().setToken('admin-token')
    const router = createTestRouter()
    await router.push('/guides')
    expect(router.currentRoute.value.name).toBe('guides')
    expect(router.currentRoute.value.params.id).toBe('')
    await router.push('/guides/12')
    expect(router.currentRoute.value.name).toBe('guides')
    expect(router.currentRoute.value.params.id).toBe('12')
  })

  it('opens city management and the seed board for an operator', async () => {
    useAuthStore().setToken('admin-token')
    const router = createTestRouter()
    await router.push('/cities')
    expect(router.currentRoute.value.meta.pageId).toBe('A-CITY')
    await router.push('/cities/12')
    expect(router.currentRoute.value.name).toBe('city-detail')
    expect(router.currentRoute.value.meta.pageId).toBe('A-CITY-DETAIL')
    await router.push('/seed-metrics')
    expect(router.currentRoute.value.meta.pageId).toBe('A-SEED')
    expect(navItems.map((item) => item.label)).toEqual(
      expect.arrayContaining(['开城/目的地', '种子看板']),
    )
  })

  it('opens banner list and a dedicated new route for an operator', async () => {
    useAuthStore().setToken('admin-token')
    const router = createTestRouter()
    await router.push('/banners')
    expect(router.currentRoute.value.meta.pageId).toBe('A-BANNER')
    expect(router.currentRoute.value.meta.title).toBe('Banner 管理')
    await router.push('/banners/new')
    expect(router.currentRoute.value.name).toBe('banner-new')
    expect(router.currentRoute.value.params.id).toBeUndefined()
    await router.push('/banners/12')
    expect(router.currentRoute.value.name).toBe('banner-edit')
    expect(router.currentRoute.value.params.id).toBe('12')
    const labels = navItems.map((item) => item.label)
    const adIndex = labels.indexOf('广告位')
    expect(labels[adIndex - 1]).toBe('攻略')
    expect(labels[adIndex + 1]).toBe('开城/目的地')
  })

  it('sends an anonymous operator away from banner editor', async () => {
    const router = createTestRouter()
    await router.push('/banners/new')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/banners/new')
  })

  it('drops an external login redirect', async () => {
    useAuthStore().setToken('admin-token')
    const router = createTestRouter()
    await router.push({ path: '/login', query: { redirect: '//evil.example' } })
    expect(router.currentRoute.value.path).toBe('/applies')
  })
})
