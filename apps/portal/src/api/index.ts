import type {
  Article,
  BookingIntentCreate,
  BookingIntentResult,
  ContactMessageCreate,
  HomestayCard,
  HomestayDetail,
  LoginResult,
  MerchantApplication,
  MerchantApplicationCreated,
  MerchantApplicationWrite,
  MyIntent,
  MyIntentDetail,
  PageResult,
  PublicConfig,
  Region,
  TouristUser,
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

export function login(phone: string, password: string) {
  return request<LoginResult>('/api/auth/login', { body: { phone, password } })
}

export function fetchMe(token: string) {
  return request<TouristUser>('/api/auth/me', { token })
}

export function fetchPublicConfig() {
  return request<PublicConfig>('/api/config/public')
}

export function fetchRegions() {
  return request<Region[]>('/api/regions')
}

export function fetchHomeFeed() {
  return request<{
    regions: Region[]
    hotHomestays: HomestayCard[]
    recommendedHomestays?: HomestayCard[]
    topics: unknown[]
    articles: Article[]
  }>('/api/home/feed')
}

export function fetchHomestays(params: {
  regionId?: number
  regionSlug?: string
  keyword?: string
  tag?: string
  sort?: string
  page?: number
  pageSize?: number
}) {
  return request<PageResult<HomestayCard>>(
    `/api/homestays${toQuery({
      regionId: params.regionId,
      regionSlug: params.regionSlug,
      keyword: params.keyword,
      tag: params.tag,
      sort: params.sort,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    })}`,
  )
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

export function createContactMessage(token: string, body: ContactMessageCreate) {
  return request<{ messageId: number; status: string; contactPhone: string }>('/api/contact-messages', {
    body,
    token,
  })
}

export function fetchMyIntents(token: string, page = 1, pageSize = 20) {
  return request<PageResult<MyIntent>>(`/api/me/intents${toQuery({ page, pageSize })}`, { token })
}

export function fetchMyIntent(token: string, id: number | string) {
  return request<MyIntentDetail>(`/api/me/intents/${id}`, { token })
}

export function fetchArticles(page = 1, pageSize = 20) {
  return request<PageResult<Article>>(`/api/articles${toQuery({ page, pageSize })}`)
}

export function fetchArticle(id: number | string) {
  return request<Article>(`/api/articles/${id}`)
}

export function uploadMerchantMedia(file: File, token?: string | null) {
  const body = new FormData()
  body.append('file', file)
  return request<{ url: string }>('/api/merchant-applications/media', { body, token })
}

export function createMerchantApplication(body: MerchantApplicationWrite, token?: string | null) {
  return request<MerchantApplicationCreated>('/api/merchant-applications', { body, token })
}

export function fetchMyMerchantApplication(token: string) {
  return request<MerchantApplication>('/api/me/merchant-application', { token })
}
