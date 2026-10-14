import type {
  AdminDashboard,
  AdminIntent,
  AdminLoginResult,
  Article,
  ArticleWrite,
  HomestayCard,
  ListingApplication,
  MerchantAccount,
  MerchantApplication,
  MerchantApproved,
  MerchantPasswordReset,
  PageResult,
  SiteConfig,
} from '@nongjiale/shared'
import { request } from '../utils/http'

function toQuery(params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') q.set(key, String(value))
  }
  const text = q.toString()
  return text ? `?${text}` : ''
}

export function adminLogin(username: string, password: string) {
  return request<AdminLoginResult>('/api/admin/auth/login', { body: { username, password } })
}

export function fetchDashboard(token: string) {
  return request<AdminDashboard>('/api/admin/dashboard', { token })
}

export function fetchIntents(token: string, params: { status?: string; page?: number; pageSize?: number } = {}) {
  return request<PageResult<AdminIntent>>(
    `/api/admin/intents${toQuery({
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
    { token },
  )
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

export function fetchMerchantApplications(
  token: string,
  params: { status?: string; page?: number; pageSize?: number } = {},
) {
  return request<PageResult<MerchantApplication>>(
    `/api/admin/merchant-applications${toQuery({
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
    { token },
  )
}

export function fetchMerchantApplication(token: string, id: number | string) {
  return request<MerchantApplication>(`/api/admin/merchant-applications/${id}`, { token })
}

export function approveMerchantApplication(token: string, id: number | string) {
  return request<MerchantApproved>(`/api/admin/merchant-applications/${id}/approve`, { method: 'POST', token })
}

export function rejectMerchantApplication(token: string, id: number | string, reason: string) {
  return request<MerchantApplication>(`/api/admin/merchant-applications/${id}/reject`, { body: { reason }, token })
}

export function fetchMerchants(token: string, page = 1, pageSize = 20) {
  return request<PageResult<MerchantAccount>>(`/api/admin/merchants${toQuery({ page, pageSize })}`, { token })
}

export function setMerchantEnabled(token: string, merchantId: number | string, enabled: boolean) {
  return request<unknown>(`/api/admin/merchants/${merchantId}/enabled`, { body: { enabled }, token })
}

export function resetMerchantPassword(token: string, merchantId: number | string) {
  return request<MerchantPasswordReset>(`/api/admin/merchants/${merchantId}/reset-password`, { method: 'POST', token })
}

export function fetchListingApplications(
  token: string,
  params: { status?: string; action?: string; page?: number; pageSize?: number } = {},
) {
  return request<PageResult<ListingApplication>>(
    `/api/admin/listing-applications${toQuery({
      status: params.status,
      action: params.action,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
    { token },
  )
}

export function fetchListingApplication(token: string, id: number | string) {
  return request<ListingApplication>(`/api/admin/listing-applications/${id}`, { token })
}

export function approveListingApplication(token: string, id: number | string) {
  return request<unknown>(`/api/admin/listing-applications/${id}/approve`, { method: 'POST', token })
}

export function rejectListingApplication(token: string, id: number | string, reason: string) {
  return request<unknown>(`/api/admin/listing-applications/${id}/reject`, { body: { reason }, token })
}

export function fetchSiteConfig(token: string) {
  return request<SiteConfig>('/api/admin/site-config', { token })
}

export function saveSiteConfig(token: string, body: SiteConfig) {
  return request<SiteConfig>('/api/admin/site-config', { method: 'PUT', body, token })
}

export function fetchArticles(token: string, params: { status?: string; page?: number; pageSize?: number } = {}) {
  return request<PageResult<Article>>(
    `/api/admin/articles${toQuery({
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
    { token },
  )
}

export function createArticle(token: string, body: ArticleWrite) {
  return request<Article>('/api/admin/articles', { body, token })
}

export function updateArticle(token: string, id: number | string, body: ArticleWrite) {
  return request<Article>(`/api/admin/articles/${id}`, { method: 'PUT', body, token })
}

export function updateArticleStatus(token: string, id: number | string, status: string) {
  return request<Article>(`/api/admin/articles/${id}/status`, { body: { status }, token })
}
