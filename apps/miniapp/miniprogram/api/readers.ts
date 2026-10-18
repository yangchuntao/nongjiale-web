import { formatDate, formatDateTime } from '../domain/datetime'
import type { HomeBanner, BannerScope } from '../domain/banners'
import type { RegionItem } from '../domain/regions'
import { CLOSED_DESTINATION_HINT } from '../config'

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface StoreCard {
  id: number
  name: string
  regionId: number | null
  regionName: string
  coverUrl: string
  priceText: string
  priceFrom: number | string | null
  homeRecommended: boolean
  homeSort: number | null
  testData: boolean
  testTag: string
  shelfStatus: string
}

export interface StorePackageItem {
  name: string
  description: string
}

export interface StoreDetail extends StoreCard {
  address: string
  phone: string
  gallery: string[]
  packageText: string
  packages: StorePackageItem[]
  facilities: string
  features: string
  notice: string
  trafficText: string
}

export type DestinationStatus = 'OPEN' | 'CLOSED' | 'NONE'

export interface StoreListResult extends PageResult<StoreCard> {
  destinationStatus: DestinationStatus
  emptyHint: string | null
}

export interface ArticleSummary {
  id: number
  title: string
  coverUrl: string
  summary: string
}

export interface ArticleDetail extends ArticleSummary {
  content: string
}

export interface HomeFeed {
  stores: StoreCard[]
  articles: ArticleSummary[]
}

export interface IntentRecord {
  id: number
  intentNo: string
  status: string
  storeId: number | null
  storeName: string
  checkIn: string
  checkOut: string
  nights: number | null
  guests: number | null
  contactName: string
  contactPhone: string
  userRemark: string
  createdAt: string
}

export interface PublicConfig {
  siteName: string
  brandColor: string
  contactPhone: string
}

export interface TouristProfile {
  userId: number | null
  phone: string | null
  displayName: string
  role: string
}

export interface WechatSession {
  token: string
  expiresAt: string
  userId: number | null
  role: string
  displayName: string
  phone: string | null
  phoneBound: boolean
  wechatBound: boolean
  accountLinked: boolean
}

export interface WechatLink {
  userId: number | null
  phone: string | null
  phoneBound: boolean
  wechatBound: boolean
  accountLinked: boolean
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function flag(value: unknown): boolean {
  return value === true || value === 'true'
}

function phoneOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const next = text(value)
  return next || null
}

export function readPage<T>(data: unknown, mapItem: (item: unknown) => T | null): PageResult<T> {
  if (Array.isArray(data)) {
    const items = data.map(mapItem).filter((item): item is T => item !== null)
    return { items, total: items.length, page: 1, pageSize: items.length || 20 }
  }
  const body = record(data)
  const rawItems = Array.isArray(body?.items) ? body.items : []
  const items = rawItems.map(mapItem).filter((item): item is T => item !== null)
  return {
    items,
    total: num(body?.total) ?? items.length,
    page: num(body?.page) ?? 1,
    pageSize: num(body?.pageSize) ?? 20,
  }
}

export function readStoreCard(value: unknown): StoreCard | null {
  const body = record(value)
  const id = num(body?.id)
  if (!body || id === null) return null
  return {
    id,
    name: text(body.name),
    regionId: num(body.regionId),
    regionName: text(body.regionName),
    coverUrl: text(body.coverUrl),
    priceText: text(body.priceText),
    priceFrom: typeof body.priceFrom === 'number' || typeof body.priceFrom === 'string' ? body.priceFrom : null,
    homeRecommended: flag(body.homeRecommended),
    homeSort: num(body.homeSort),
    testData: flag(body.testData),
    testTag: text(body.testTag),
    shelfStatus: text(body.shelfStatus),
  }
}

export function readStoreDetail(value: unknown): StoreDetail | null {
  const card = readStoreCard(value)
  const body = record(value)
  if (!card || !body) return null
  const gallery = Array.isArray(body.gallery) ? body.gallery.map(text).filter(Boolean) : []
  const packages: StorePackageItem[] = []
  if (Array.isArray(body.packages)) {
    for (const item of body.packages) {
      const row = record(item)
      if (!row) continue
      const name = text(row.name || row.title)
      const description = text(row.description || row.content || row.priceText)
      if (!name && !description) continue
      packages.push({ name, description })
    }
  }
  return {
    ...card,
    address: text(body.address),
    phone: text(body.phone),
    gallery,
    packageText: text(body.packageText),
    packages,
    facilities: text(body.facilities),
    features: text(body.features),
    notice: text(body.notice),
    trafficText: text(body.trafficText),
  }
}

export function readStoreList(data: unknown): StoreListResult {
  const page = readPage(data, readStoreCard)
  const body = record(data)
  const raw = text(body?.destinationStatus)
  const destinationStatus: DestinationStatus = raw === 'OPEN' || raw === 'CLOSED' || raw === 'NONE' ? raw : 'NONE'
  if (destinationStatus === 'CLOSED') {
    return {
      items: [],
      total: 0,
      page: page.page,
      pageSize: page.pageSize,
      destinationStatus,
      emptyHint: text(body?.emptyHint) || CLOSED_DESTINATION_HINT,
    }
  }
  return { ...page, destinationStatus, emptyHint: null }
}

export function readRegions(value: unknown): RegionItem[] {
  const items: RegionItem[] = []
  const visit = (nodes: unknown[], inheritedParent: number | null) => {
    for (const node of nodes) {
      const body = record(node)
      const id = num(body?.id)
      const name = text(body?.name)
      if (!body || id === null || !name) continue
      const parentId = body.parentId === undefined ? inheritedParent : num(body.parentId)
      const levelValue = num(body.level)
      const level = levelValue !== null ? levelValue : text(body.level).toUpperCase() || null
      items.push({
        id,
        name,
        slug: text(body.slug || body.citySlug),
        parentId,
        level,
        openStatus: text(body.openStatus ?? body.destinationStatus).toUpperCase(),
      })
      if (Array.isArray(body.children)) visit(body.children, id)
    }
  }
  if (Array.isArray(value)) visit(value, null)
  else {
    const body = record(value)
    if (Array.isArray(body?.items)) visit(body.items, null)
  }
  return items
}

function readBannerScope(value: unknown): BannerScope | null {
  const scope = text(value).toUpperCase()
  if (scope === 'ALL' || scope === 'CITY') return scope
  return null
}

export function readHomeBanner(value: unknown): HomeBanner | null {
  const body = record(value)
  if (!body) return null
  const id = text(body.id)
  const imageUrl = text(body.imageUrl)
  const linkUrl = text(body.linkUrl)
  const scope = readBannerScope(body.scope)
  const sortOrder = num(body.sortOrder)
  if (!id || !imageUrl || !linkUrl || !scope || sortOrder === null) return null
  const title = text(body.title)
  const enabled = !(body.enabled === false || body.enabled === 'false' || body.enabled === 0 || body.enabled === '0')
  return {
    id,
    title: title || null,
    imageUrl,
    linkUrl,
    scope,
    cityId: text(body.cityId) || null,
    citySlug: text(body.citySlug) || null,
    cityName: text(body.cityName) || null,
    sortOrder,
    enabled,
  }
}

export function readHomeBanners(data: unknown): HomeBanner[] {
  if (!Array.isArray(data)) return []
  return data.map(readHomeBanner).filter((item): item is HomeBanner => item !== null)
}

export function readArticleSummary(value: unknown): ArticleSummary | null {
  const body = record(value)
  const id = num(body?.id)
  if (!body || id === null) return null
  return {
    id,
    title: text(body.title),
    coverUrl: text(body.coverUrl || body.cover),
    summary: text(body.summary),
  }
}

export function readArticleDetail(value: unknown): ArticleDetail | null {
  const summary = readArticleSummary(value)
  const body = record(value)
  if (!summary || !body) return null
  return { ...summary, content: text(body.content || body.body) }
}

export function readHomeFeed(value: unknown): HomeFeed {
  const body = record(value)
  const stores = (Array.isArray(body?.stores) ? body.stores : [])
    .map(readStoreCard)
    .filter((item): item is StoreCard => item !== null)
    .sort((a, b) => (a.homeSort ?? Number.MAX_SAFE_INTEGER) - (b.homeSort ?? Number.MAX_SAFE_INTEGER))
  const articles = (Array.isArray(body?.articles) ? body.articles : [])
    .map(readArticleSummary)
    .filter((item): item is ArticleSummary => item !== null)
  return { stores, articles }
}

export function readIntent(value: unknown): IntentRecord | null {
  const body = record(value)
  const id = num(body?.id)
  if (!body || id === null) return null
  return {
    id,
    intentNo: text(body.intentNo),
    status: text(body.status),
    storeId: num(body.storeId),
    storeName: text(body.storeName),
    checkIn: formatDate(body.checkIn) || text(body.checkIn),
    checkOut: formatDate(body.checkOut) || text(body.checkOut),
    nights: num(body.nights),
    guests: num(body.guests),
    contactName: text(body.contactName),
    contactPhone: text(body.contactPhone),
    userRemark: text(body.userRemark),
    createdAt: formatDateTime(body.createdAt) || text(body.createdAt),
  }
}

export function readPublicConfig(value: unknown): PublicConfig {
  const body = record(value)
  return {
    siteName: text(body?.siteName),
    brandColor: text(body?.brandColor),
    contactPhone: text(body?.contactPhone),
  }
}

export function readTouristProfile(value: unknown): TouristProfile {
  const body = record(value)
  return {
    userId: num(body?.userId ?? body?.id),
    phone: phoneOrNull(body?.phone),
    displayName: text(body?.displayName),
    role: text(body?.role) || 'TOURIST',
  }
}

export function readWechatSession(value: unknown): WechatSession | null {
  const body = record(value)
  const token = text(body?.token)
  if (!body || !token) return null
  return {
    token,
    expiresAt: text(body.expiresAt),
    userId: num(body.userId),
    role: text(body.role) || 'TOURIST',
    displayName: text(body.displayName),
    phone: phoneOrNull(body.phone),
    phoneBound: body.phoneBound === true,
    wechatBound: body.wechatBound === true,
    accountLinked: body.accountLinked === true,
  }
}

export function readWechatLink(value: unknown): WechatLink {
  const body = record(value)
  return {
    userId: num(body?.userId),
    phone: phoneOrNull(body?.phone),
    phoneBound: body?.phoneBound === true,
    wechatBound: body?.wechatBound === true,
    accountLinked: body?.accountLinked === true,
  }
}
