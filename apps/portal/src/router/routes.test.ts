import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { installAuthGuard, safeInternalPath } from './guard'
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

describe('safeInternalPath', () => {
  it('keeps in-app paths and drops external targets', () => {
    expect(safeInternalPath('/listings/3', '/')).toBe('/listings/3')
    expect(safeInternalPath('https://evil.example', '/')).toBe('/')
    expect(safeInternalPath('//evil.example', '/')).toBe('/')
    expect(safeInternalPath('/login', '/')).toBe('/')
    expect(safeInternalPath('/register?from=x', '/')).toBe('/')
  })
})

describe('portal routes', () => {
  it('keeps public listing detail open and sends intent to login', async () => {
    const router = createTestRouter()
    await router.push('/listings/8')
    expect(router.currentRoute.value.name).toBe('listing-detail')

    await router.push('/listings/8/intent')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/listings/8/intent')
  })

  it('bounces an authenticated visitor off login and register', async () => {
    useAuthStore().setToken('portal-token')
    const router = createTestRouter()
    await router.push({ path: '/login', query: { redirect: '/my/intents' } })
    expect(router.currentRoute.value.path).toBe('/my/intents')

    await router.push('/register')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('ignores an external redirect on the login page', async () => {
    useAuthStore().setToken('portal-token')
    const router = createTestRouter()
    await router.push({ path: '/login', query: { redirect: 'https://evil.example/phish' } })
    expect(router.currentRoute.value.path).toBe('/')
  })
})
