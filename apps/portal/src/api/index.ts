import type {
  BookingIntentCreate,
  BookingIntentResult,
  ContactMessageCreate,
  HomestayCard,
  HomestayDetail,
  LoginResult,
  PageResult,
  Region,
  TouristUser,
} from '@nongjiale/shared'
import { request } from '../utils/http'

export function login(phone: string, password: string) {
  return request<LoginResult>('/api/auth/login', { body: { phone, password } })
}

export function fetchMe(token: string) {
  return request<TouristUser>('/api/auth/me', { token })
}

export function fetchPublicConfig() {
  return request<{ contactPhone: string }>('/api/config/public')
}

export function fetchRegions() {
  return request<Region[]>('/api/regions')
}

export function fetchHomeFeed() {
  return request<{
    regions: Region[]
    hotHomestays: HomestayCard[]
    topics: unknown[]
    articles: unknown[]
  }>('/api/home/feed')
}

export function fetchHomestays(params: {
  regionId?: number
  regionSlug?: string
  keyword?: string
  page?: number
  pageSize?: number
}) {
  const q = new URLSearchParams()
  if (params.regionId != null) q.set('regionId', String(params.regionId))
  if (params.regionSlug) q.set('regionSlug', params.regionSlug)
  if (params.keyword) q.set('keyword', params.keyword)
  q.set('page', String(params.page ?? 1))
  q.set('pageSize', String(params.pageSize ?? 10))
  return request<PageResult<HomestayCard>>(`/api/homestays?${q}`)
}

export function fetchHomestay(id: number | string) {
  return request<HomestayDetail>(`/api/homestays/${id}`)
}

export function createBookingIntent(token: string, body: BookingIntentCreate, idempotencyKey: string) {
  return request<BookingIntentResult>('/api/booking-intents', {
    body,
    token,
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}

export function createContactMessage(
  token: string,
  body: ContactMessageCreate,
) {
  return request<{ messageId: number; status: string; contactPhone: string }>('/api/contact-messages', {
    body,
    token,
  })
}
