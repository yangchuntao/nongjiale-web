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

describe('merchant routes', () => {
  it('sends anonymous merchants to login', async () => {
    const router = createTestRouter()
    await router.push('/stores/4/shelf')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/stores/4/shelf')
  })

  it('opens shelf and store edit for an authenticated merchant', async () => {
    useAuthStore().setToken('merchant-token')
    const router = createTestRouter()
    await router.push('/stores/4/shelf')
    expect(router.currentRoute.value.name).toBe('store-shelf')
    await router.push('/stores/4')
    expect(router.currentRoute.value.name).toBe('store-edit')
  })

  it('keeps merchant navigation on stores and intents only', () => {
    expect(navItems.map((item) => item.label)).toEqual(['门店', '本店意向'])
    expect(navItems.map((item) => item.path).join(' ')).not.toMatch(/banner|广告/)
  })

  it('bounces an authenticated merchant off login to the store list', async () => {
    useAuthStore().setToken('merchant-token')
    const router = createTestRouter()
    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/stores')
  })
})
