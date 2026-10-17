import type { PageResult, PhonePasswordCredentials } from '@nongjiale/shared'
import { http } from './client'
import { LISTING_PAGE_SIZE, mapListingSearch } from './query'
import {
  readArticleDetail,
  readArticleSummary,
  readAuthToken,
  readHomeFeed,
  readIntent,
  readPage,
  readRegions,
  readStoreDetail,
  readStoreList,
  readTouristProfile,
  type ArticleDetail,
  type ArticleSummary,
  type HomeFeed,
  type IntentRecord,
  type RegionItem,
  type StoreDetail,
  type StoreListResult,
  type TouristProfile,
} from './readers'
import type { CreateIntentBody } from '../domain/intent'
import type { MerchantApplyBody } from '../domain/apply'

export async function fetchHomeFeed(signal?: AbortSignal): Promise<HomeFeed> {
  const data = await http.request<unknown>('/api/home/feed', { signal })
  return readHomeFeed(data)
}

export async function fetchRegions(signal?: AbortSignal): Promise<RegionItem[]> {
  const data = await http.request<unknown>('/api/regions', { signal })
  return readRegions(data)
}

export async function fetchStores(
  params: Record<string, string | undefined>,
  signal?: AbortSignal,
): Promise<StoreListResult> {
  const query = mapListingSearch({
    ...params,
    page: params.page || '1',
    pageSize: params.pageSize || String(LISTING_PAGE_SIZE),
    sort: params.sort || 'comprehensive',
  })
  const data = await http.request<unknown>('/api/stores', { query, signal })
  return readStoreList(data)
}

export async function fetchStore(id: string, signal?: AbortSignal): Promise<StoreDetail> {
  const data = await http.request<unknown>(`/api/stores/${id}`, { signal })
  const store = readStoreDetail(data)
  if (!store) throw new Error('房源详情缺少编号')
  return store
}

export async function createIntent(body: CreateIntentBody): Promise<IntentRecord> {
  const data = await http.request<unknown>('/api/booking-intents', { method: 'POST', body })
  const intent = readIntent(data)
  if (!intent) throw new Error('意向响应缺少编号')
  return intent
}

export async function fetchMyIntents(page = 1, signal?: AbortSignal): Promise<PageResult<IntentRecord>> {
  const data = await http.request<unknown>('/api/me/intents', {
    query: { page, pageSize: LISTING_PAGE_SIZE },
    signal,
  })
  return readPage(data, readIntent)
}

export async function fetchMyIntent(id: string, signal?: AbortSignal): Promise<IntentRecord> {
  const data = await http.request<unknown>(`/api/me/intents/${id}`, { signal })
  const intent = readIntent(data)
  if (!intent) throw new Error('意向详情缺少编号')
  return intent
}

export async function fetchArticles(page = 1, signal?: AbortSignal): Promise<PageResult<ArticleSummary>> {
  const data = await http.request<unknown>('/api/articles', {
    query: { page, pageSize: LISTING_PAGE_SIZE },
    signal,
  })
  return readPage(data, readArticleSummary)
}

export async function fetchArticle(id: string, signal?: AbortSignal): Promise<ArticleDetail> {
  const data = await http.request<unknown>(`/api/articles/${id}`, { signal })
  const article = readArticleDetail(data)
  if (!article) throw new Error('攻略详情缺少编号')
  return article
}

export async function login(body: PhonePasswordCredentials): Promise<string> {
  const data = await http.request<unknown>('/api/auth/login', { method: 'POST', body })
  return readAuthToken(data)
}

export async function register(body: PhonePasswordCredentials): Promise<string> {
  const data = await http.request<unknown>('/api/auth/register', { method: 'POST', body })
  return readAuthToken(data)
}

export async function fetchMe(): Promise<TouristProfile> {
  const data = await http.request<unknown>('/api/auth/me')
  return readTouristProfile(data)
}

export async function submitMerchantApply(body: MerchantApplyBody): Promise<void> {
  await http.request<unknown>('/api/merchant-applies', { method: 'POST', body })
}
