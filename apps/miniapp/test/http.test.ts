import { describe, expect, it, vi } from 'vitest'
import { ApiError, createClient, type MiniRequester, type MiniResponse } from '../miniprogram/api/http'

function json(statusCode: number, body: unknown): MiniResponse {
  return { statusCode, data: body }
}

describe('wx.request client', () => {
  it('unwraps data and omits Authorization on public calls', async () => {
    const request = vi.fn<MiniRequester>(async () => json(200, { code: 0, message: 'ok', data: { siteName: '苏中' } }))
    const client = createClient({
      baseUrl: 'http://localhost:8080/',
      mode: 'public',
      request,
      getToken: () => ({ token: 'should-not-send', stored: true }),
    })
    await expect(client.request('/api/home/banners', { query: { keyword: '' } })).resolves.toEqual({ siteName: '苏中' })
    const sent = request.mock.calls[0]?.[0]
    expect(sent?.url).toBe('http://localhost:8080/api/home/banners')
    expect(sent?.header.Authorization).toBeUndefined()
  })

  it('sends a stored tourist bearer and clears it only on 未登录', async () => {
    const request = vi.fn<MiniRequester>(async () => json(401, { code: 401, message: '未登录', data: null }))
    const onUnauthorized = vi.fn()
    const client = createClient({
      baseUrl: 'http://localhost:8080',
      mode: 'tourist',
      request,
      getToken: () => ({ token: 'abc', stored: true }),
      onUnauthorized,
    })
    await expect(client.request('/api/me/intents')).rejects.toMatchObject({ message: '未登录' })
    expect(request.mock.calls[0]?.[0].header.Authorization).toBe('Bearer abc')
    expect(onUnauthorized).toHaveBeenCalledWith({ action: 'clear-stored', message: '未登录' })
  })

  it('hides a public 401 without clearing the linked token', async () => {
    const request = vi.fn<MiniRequester>(async () => json(401, { code: 401, message: '未登录', data: null }))
    const onUnauthorized = vi.fn()
    const client = createClient({
      baseUrl: 'http://localhost:8080',
      mode: 'public',
      request,
      onUnauthorized,
    })
    await expect(client.request('/api/home/banners')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('leaves the linked token in place when the password is wrong', async () => {
    const request = vi.fn<MiniRequester>(async () => json(401, { code: 401, message: '手机号或密码错误', data: null }))
    const onUnauthorized = vi.fn()
    const client = createClient({
      baseUrl: 'http://localhost:8080',
      mode: 'wechat',
      request,
      getToken: () => ({ token: 'linked', stored: true }),
      onUnauthorized,
    })
    await expect(client.request('/api/auth/wechat/bind', { method: 'POST', body: { phone: '13800138000', password: 'nope' } })).rejects.toMatchObject({
      message: '手机号或密码错误',
    })
    expect(onUnauthorized).not.toHaveBeenCalled()
    const sent = request.mock.calls[0]?.[0]
    expect(sent?.data).toBe('{"phone":"13800138000","password":"nope"}')
  })
})
