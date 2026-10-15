import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { installAuthGuard } from './guard'
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

  it('drops an external login redirect', async () => {
    useAuthStore().setToken('admin-token')
    const router = createTestRouter()
    await router.push({ path: '/login', query: { redirect: '//evil.example' } })
    expect(router.currentRoute.value.path).toBe('/applies')
  })
})
