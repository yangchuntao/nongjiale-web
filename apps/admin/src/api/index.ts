import type { AdminIntent, AdminLoginResult, HomestayCard, PageResult } from '@nongjiale/shared'
import { request } from '../utils/http'

export function adminLogin(username: string, password: string) {
  return request<AdminLoginResult>('/api/admin/auth/login', { body: { username, password } })
}

export function fetchDashboard(token: string) {
  return request<{ pendingIntents: number; pendingMessages: number }>('/api/admin/dashboard', { token })
}

export function fetchIntents(token: string, params: { status?: string; page?: number; pageSize?: number } = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  q.set('page', String(params.page ?? 1))
  q.set('pageSize', String(params.pageSize ?? 20))
  return request<PageResult<AdminIntent>>(`/api/admin/intents?${q}`, { token })
}

export function fetchIntent(token: string, id: number | string) {
  return request<AdminIntent>(`/api/admin/intents/${id}`, { token })
}

export function updateIntentStatus(
  token: string,
  id: number | string,
  body: { status: string; version: number; note?: string },
) {
  return request<AdminIntent>(`/api/admin/intents/${id}/status`, { body, token })
}

export function fetchHomestays(token: string, page = 1) {
  return request<PageResult<Pick<HomestayCard, 'id' | 'name' | 'status' | 'priceFrom' | 'regionId'> & { version: number }>>(
    `/api/admin/homestays?page=${page}&pageSize=20`,
    { token },
  )
}

export function updateHomestayStatus(
  token: string,
  id: number | string,
  body: { status: string; version: number },
) {
  return request(`/api/admin/homestays/${id}/status`, { body, token })
}
