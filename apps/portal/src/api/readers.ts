import { intentDisplayLabel, type PageResult } from '@nongjiale/shared'

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
  id?: number
  name?: string
  title?: string
  description?: string
  content?: string
  priceText?: string
  price?: number | string | null
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
  version: number | null
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

export interface RegionItem {
  id: number
  name: string
  parentId: number | null
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

export interface TouristProfile {
  id: number | null
  phone: string
  role: string
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

export function readDate(value: unknown): string {
  if (typeof value === 'string') return value.slice(0, 10)
  if (Array.isArray(value) && value.length >= 3 && value.every((part) => typeof part === 'number')) {
    const [year, month, day] = value as number[]
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return ''
}

export function readDateTime(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.length >= 3 && value.every((part) => typeof part === 'number')) {
    const hour = typeof value[3] === 'number' ? value[3] : 0
    const minute = typeof value[4] === 'number' ? value[4] : 0
    return `${readDate(value)} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  return ''
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
      const id = num(row.id)
      packages.push({
        ...(id === null ? {} : { id }),
        name: text(row.name),
        title: text(row.title),
        description: text(row.description),
        content: text(row.content),
        priceText: text(row.priceText),
        price: typeof row.price === 'number' || typeof row.price === 'string' ? row.price : null,
      })
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
    version: num(body.version),
  }
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
  return {
    ...summary,
    content: text(body.content || body.body),
  }
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
      items.push({ id, name, parentId })
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
    checkIn: readDate(body.checkIn),
    checkOut: readDate(body.checkOut),
    nights: num(body.nights),
    guests: num(body.guests),
    contactName: text(body.contactName),
    contactPhone: text(body.contactPhone),
    userRemark: text(body.userRemark),
    createdAt: readDateTime(body.createdAt),
  }
}

export function readAuthToken(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim()
  const body = record(value)
  for (const key of ['token', 'accessToken', 'access_token']) {
    const token = text(body?.[key])
    if (token) return token
  }
  throw new Error('登录响应缺少令牌')
}

export function readTouristProfile(value: unknown): TouristProfile {
  const body = record(value)
  const phone = text(body?.phone || body?.contactPhone || body?.mobile)
  return {
    id: num(body?.id ?? body?.userId),
    phone,
    role: text(body?.role) || 'TOURIST',
  }
}

export function intentStatusLabel(status: string): string {
  return intentDisplayLabel(status)
}

export function intentStatusTone(status: string): 'warning' | 'info' | 'success' | 'neutral' {
  if (status === 'PENDING' || status === 'RESCHEDULED') return 'warning'
  if (status === 'CONFIRMED') return 'info'
  if (status === 'CHECKED_IN') return 'success'
  return 'neutral'
}

export function storeTestLabel(store: { testData?: boolean; testTag?: string }): string {
  const tag = store.testTag?.trim()
  if (tag) return tag
  if (store.testData) return '测试'
  return ''
}

/** 门户详情只展示对客标签。排序、上架、首页推荐留给运营端。 */
export function portalVisitorTags(store: { testData?: boolean; testTag?: string }): string[] {
  const label = storeTestLabel(store)
  return label ? [label] : []
}

export function priceLabel(priceText?: string | null, priceFrom?: number | string | null): string {
  const textValue = priceText?.trim()
  if (textValue) return textValue
  if (priceFrom === null || priceFrom === undefined || priceFrom === '') return ''
  return `¥${priceFrom} 起`
}

export function canSubmitIntent(shelfStatus: string | null | undefined): boolean {
  return !shelfStatus || shelfStatus === 'ON_SHELF'
}

export interface HomeFeed {
  stores: StoreCard[]
  articles: ArticleSummary[]
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
