import { PAGE_SIZE } from '../config'
import type { HomeBanner } from '../domain/banners'
import type { CreateIntentBody } from '../domain/intent'
import type { RegionItem } from '../domain/regions'
import type { PhoneCodeBindBody, PasswordBindBody } from '../domain/session'
import { publicRequest, touristRequest, wechatRequest } from './runtime'
import {
  readArticleDetail,
  readArticleSummary,
  readHomeBanners,
  readHomeFeed,
  readIntent,
  readPage,
  readPublicConfig,
  readRegions,
  readStoreDetail,
  readStoreList,
  readTouristProfile,
  readWechatLink,
  readWechatSession,
  type ArticleDetail,
  type ArticleSummary,
  type HomeFeed,
  type IntentRecord,
  type PageResult,
  type PublicConfig,
  type StoreDetail,
  type StoreListResult,
  type TouristProfile,
  type WechatLink,
  type WechatSession,
} from './readers'

export async function fetchPublicConfig(): Promise<PublicConfig> {
  const data = await publicRequest<unknown>('/api/config/public')
  return readPublicConfig(data)
}

export async function fetchHomeBanners(): Promise<HomeBanner[]> {
  const data = await publicRequest<unknown>('/api/home/banners')
  return readHomeBanners(data)
}

export async function fetchHomeFeed(): Promise<HomeFeed> {
  const data = await publicRequest<unknown>('/api/home/feed')
  return readHomeFeed(data)
}

export async function fetchRegions(): Promise<RegionItem[]> {
  const data = await publicRequest<unknown>('/api/regions')
  return readRegions(data)
}

export async function fetchStores(query: Record<string, string | number>): Promise<StoreListResult> {
  const data = await publicRequest<unknown>('/api/stores', { query })
  return readStoreList(data)
}

export async function fetchStore(id: string): Promise<StoreDetail> {
  const data = await publicRequest<unknown>(`/api/stores/${encodeURIComponent(id)}`)
  const store = readStoreDetail(data)
  if (!store) throw new Error('房源详情缺少编号')
  return store
}

export async function fetchArticles(page = 1): Promise<PageResult<ArticleSummary>> {
  const data = await publicRequest<unknown>('/api/articles', { query: { page, pageSize: PAGE_SIZE } })
  return readPage(data, readArticleSummary)
}

export async function fetchArticle(id: string): Promise<ArticleDetail> {
  const data = await publicRequest<unknown>(`/api/articles/${encodeURIComponent(id)}`)
  const article = readArticleDetail(data)
  if (!article) throw new Error('攻略详情缺少编号')
  return article
}

export async function createIntent(body: CreateIntentBody): Promise<IntentRecord> {
  const data = await touristRequest<unknown>('/api/booking-intents', { method: 'POST', body })
  const intent = readIntent(data)
  if (!intent) throw new Error('意向响应缺少编号')
  return intent
}

export async function fetchMyIntents(page = 1): Promise<PageResult<IntentRecord>> {
  const data = await touristRequest<unknown>('/api/me/intents', { query: { page, pageSize: PAGE_SIZE } })
  return readPage(data, readIntent)
}

export async function fetchMyIntent(id: string): Promise<IntentRecord> {
  const data = await touristRequest<unknown>(`/api/me/intents/${encodeURIComponent(id)}`)
  const intent = readIntent(data)
  if (!intent) throw new Error('意向详情缺少编号')
  return intent
}

export async function fetchMe(): Promise<TouristProfile> {
  const data = await touristRequest<unknown>('/api/auth/me')
  return readTouristProfile(data)
}

export async function wechatLogin(code: string): Promise<WechatSession> {
  const data = await publicRequest<unknown>('/api/auth/wechat/login', { method: 'POST', body: { code } })
  const session = readWechatSession(data)
  if (!session) throw new Error('登录响应缺少令牌')
  return session
}

export async function wechatBind(body: PhoneCodeBindBody | PasswordBindBody): Promise<WechatSession> {
  const data = await wechatRequest<unknown>('/api/auth/wechat/bind', { method: 'POST', body })
  const session = readWechatSession(data)
  if (!session) throw new Error('登录响应缺少令牌')
  return session
}

export async function wechatUnbind(): Promise<WechatLink> {
  const data = await wechatRequest<unknown>('/api/auth/wechat/unbind', { method: 'POST' })
  return readWechatLink(data)
}

export async function fetchWechatLink(): Promise<WechatLink> {
  const data = await wechatRequest<unknown>('/api/auth/wechat/link')
  return readWechatLink(data)
}
