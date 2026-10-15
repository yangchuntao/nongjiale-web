import type {
  ListingApplication,
  MerchantDashboard,
  MerchantLoginResult,
  MerchantProfile,
  MerchantStore,
  MerchantStoreWrite,
  MerchantIntent,
  PageResult,
  Region,
  StorePackage,
  StorePackageWrite,
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

export function merchantLogin(phone: string, password: string) {
  return request<MerchantLoginResult>('/api/merchant/auth/login', { body: { phone, password } })
}

export function fetchMe(token: string) {
  return request<MerchantProfile>('/api/merchant/auth/me', { token })
}

export function changePassword(token: string, body: { oldPassword: string; newPassword: string }) {
  return request<unknown>('/api/merchant/auth/password', { body, token })
}

export function fetchDashboard(token: string) {
  return request<MerchantDashboard>('/api/merchant/dashboard', { token })
}

export function fetchRegions() {
  return request<Region[]>('/api/regions')
}

export function fetchStores(token: string, page = 1, pageSize = 20) {
  return request<PageResult<MerchantStore>>(`/api/merchant/stores${toQuery({ page, pageSize })}`, { token })
}

export function fetchStore(token: string, storeId: number | string) {
  return request<MerchantStore>(`/api/merchant/stores/${storeId}`, { token })
}

export function createStore(token: string, body: MerchantStoreWrite) {
  return request<MerchantStore>('/api/merchant/stores', { body, token })
}

export function updateStore(token: string, storeId: number | string, body: MerchantStoreWrite) {
  return request<MerchantStore>(`/api/merchant/stores/${storeId}`, { method: 'PUT', body, token })
}

export function deleteStore(token: string, storeId: number | string) {
  return request<unknown>(`/api/merchant/stores/${storeId}`, { method: 'DELETE', token })
}

export function fetchPackages(token: string, storeId: number | string) {
  return request<StorePackage[] | PageResult<StorePackage>>(`/api/merchant/stores/${storeId}/packages`, { token })
}

export function createPackage(token: string, storeId: number | string, body: StorePackageWrite) {
  return request<StorePackage>(`/api/merchant/stores/${storeId}/packages`, { body, token })
}

export function updatePackage(
  token: string,
  storeId: number | string,
  packageId: number | string,
  body: StorePackageWrite,
) {
  return request<StorePackage>(`/api/merchant/stores/${storeId}/packages/${packageId}`, {
    method: 'PUT',
    body,
    token,
  })
}

export function deletePackage(token: string, storeId: number | string, packageId: number | string) {
  return request<unknown>(`/api/merchant/stores/${storeId}/packages/${packageId}`, { method: 'DELETE', token })
}

export function fetchTags(token: string, storeId: number | string) {
  return request<{ tags?: string[] }>(`/api/merchant/stores/${storeId}/tags`, { token })
}

export function replaceTags(token: string, storeId: number | string, tags: string[]) {
  return request<{ tags?: string[] }>(`/api/merchant/stores/${storeId}/tags`, {
    method: 'PUT',
    body: { tags },
    token,
  })
}

export function createListingApplication(
  token: string,
  storeId: number | string,
  body: { action: 'PUBLISH' | 'UNPUBLISH'; note?: string },
) {
  return request<ListingApplication>(`/api/merchant/stores/${storeId}/listing-applications`, { body, token })
}

export function fetchListingApplications(
  token: string,
  params: { storeId?: number | string; status?: string; page?: number; pageSize?: number } = {},
) {
  return request<PageResult<ListingApplication>>(
    `/api/merchant/listing-applications${toQuery({
      storeId: params.storeId,
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
    { token },
  )
}

export function fetchListingApplication(token: string, id: number | string) {
  return request<ListingApplication>(`/api/merchant/listing-applications/${id}`, { token })
}

export function fetchIntents(
  token: string,
  params: { storeId?: number | string; status?: string; page?: number; pageSize?: number } = {},
) {
  return request<PageResult<MerchantIntent>>(
    `/api/merchant/intents${toQuery({
      storeId: params.storeId,
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
    { token },
  )
}

export function fetchIntent(token: string, id: number | string) {
  return request<MerchantIntent>(`/api/merchant/intents/${id}`, { token })
}
