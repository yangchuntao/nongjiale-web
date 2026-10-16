import type { PageResult, PhonePasswordCredentials } from '@nongjiale/shared'
import { http } from './client'
import {
  MERCHANT_API,
  merchantIntentPath,
  merchantShelfApplyPath,
  merchantStorePath,
} from './paths'
import {
  MERCHANT_PAGE_SIZE,
  buildShelfBody,
  buildStoreUpdateBody,
  readIntent,
  readMerchantLogin,
  readMerchantPage,
  readShelfApplication,
  readStore,
  type IntentRecord,
  type MerchantLoginData,
  type ShelfApplication,
  type StoreDetail,
  type StoreDraft,
} from './readers'

export async function loginMerchant(body: PhonePasswordCredentials): Promise<MerchantLoginData> {
  const data = await http.request<unknown>(MERCHANT_API.login, {
    method: 'POST',
    body: { phone: body.phone, password: body.password },
  })
  return readMerchantLogin(data)
}

export async function fetchMerchantStores(page = 1, signal?: AbortSignal): Promise<PageResult<StoreDetail>> {
  const data = await http.request<unknown>(MERCHANT_API.stores, {
    query: { page, pageSize: MERCHANT_PAGE_SIZE },
    signal,
  })
  return readMerchantPage(data, readStore)
}

export async function fetchMerchantStore(id: string, signal?: AbortSignal): Promise<StoreDetail> {
  const data = await http.request<unknown>(merchantStorePath(id), { signal })
  const store = readStore(data)
  if (!store) throw new Error('门店详情缺少编号')
  return store
}

export async function updateMerchantStore(id: string, draft: StoreDraft): Promise<StoreDetail | null> {
  const data = await http.request<unknown>(merchantStorePath(id), {
    method: 'PUT',
    body: buildStoreUpdateBody(draft),
  })
  if (data === null || data === undefined) return null
  return readStore(data)
}

export async function fetchShelfApplications(
  params: { storeId?: string; page?: number; pageSize?: number },
  signal?: AbortSignal,
): Promise<PageResult<ShelfApplication>> {
  const data = await http.request<unknown>(MERCHANT_API.shelfApplications, {
    query: {
      storeId: params.storeId,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? MERCHANT_PAGE_SIZE,
    },
    signal,
  })
  return readMerchantPage(data, readShelfApplication)
}

export async function createShelfApplication(
  storeId: string,
  action: 'PUBLISH' | 'UNPUBLISH',
  reason: string,
): Promise<void> {
  await http.request<unknown>(merchantShelfApplyPath(storeId), {
    method: 'POST',
    body: buildShelfBody(action, reason),
  })
}

export async function fetchMerchantIntents(page = 1, signal?: AbortSignal): Promise<PageResult<IntentRecord>> {
  const data = await http.request<unknown>(MERCHANT_API.intents, {
    query: { page, pageSize: MERCHANT_PAGE_SIZE },
    signal,
  })
  return readMerchantPage(data, readIntent)
}

export async function fetchMerchantIntent(id: string, signal?: AbortSignal): Promise<IntentRecord> {
  const data = await http.request<unknown>(merchantIntentPath(id), { signal })
  const intent = readIntent(data)
  if (!intent) throw new Error('意向详情缺少编号')
  return intent
}
