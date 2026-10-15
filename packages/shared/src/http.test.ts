import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createHttpClient } from './http'
import { TOKEN_KEYS, tokenStorageKey } from './token-keys'
import { INTENT_STATUS_LABEL } from './types'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('token keys', () => {
  it('keeps the three apps on separate storage keys', () => {
    expect(TOKEN_KEYS.portal).toBe('nj_portal_token')
    expect(TOKEN_KEYS.admin).toBe('nj_admin_token')
    expect(TOKEN_KEYS.merchant).toBe('nj_merchant_token')
    expect(new Set(Object.values(TOKEN_KEYS)).size).toBe(3)
    expect(tokenStorageKey('merchant')).toBe('nj_merchant_token')
  })
})

describe('intent status labels', () => {
  it('maps CHECKED_IN to 已入住', () => {
    expect(INTENT_STATUS_LABEL.CHECKED_IN).toBe('已入住')
    for (const label of Object.values(INTENT_STATUS_LABEL)) {
      expect(label.includes('已成交')).toBe(false)
      expect(label.includes('已达成')).toBe(false)
    }
  })
})

type FetchMock = (input: string, init?: RequestInit) => Promise<Response>

describe('createHttpClient', () => {
  it('sends Bearer and unwraps data when code is 0', async () => {
    const fetchMock = vi.fn<FetchMock>(
      async () =>
        new Response(JSON.stringify({ code: 0, message: 'ok', data: { id: 7 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const client = createHttpClient({
      baseUrl: 'http://localhost:8080',
      getToken: () => 'portal-token',
    })
    const data = await client.request<{ id: number }>('/api/stores', {
      query: { page: 1, keyword: '田', skip: undefined },
    })

    expect(data).toEqual({ id: 7 })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('http://localhost:8080/api/stores?page=1&keyword=%E7%94%B0')
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBe('Bearer portal-token')
    expect(init?.credentials).toBe('omit')
  })

  it('omits Authorization when no token is present', async () => {
    const fetchMock = vi.fn<FetchMock>(
      async () =>
        new Response(JSON.stringify({ code: 0, message: 'ok', data: null }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const client = createHttpClient({ getToken: () => '   ' })
    await client.request('/api/config/public')
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    expect(headers.has('Authorization')).toBe(false)
  })

  it('throws ApiError when code is not 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ code: 409, message: '该房源当前不可提交意向', data: null }),
            { status: 409 },
          ),
      ),
    )
    const client = createHttpClient()
    await expect(client.request('/api/booking-intents', { method: 'POST', body: {} })).rejects.toMatchObject({
      name: 'ApiError',
      code: 409,
      httpStatus: 409,
      message: '该房源当前不可提交意向',
    })
  })

  it('clears the session hook on HTTP 401', async () => {
    const onUnauthorized = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ code: 401, message: '未登录', data: null }), { status: 401 }),
      ),
    )
    const client = createHttpClient({ getToken: () => 'expired', onUnauthorized })
    await expect(client.request('/api/me')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })
})
