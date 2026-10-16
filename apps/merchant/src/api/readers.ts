import { INTENT_STATUS_LABEL, type IntentStatus, type PageResult } from '@nongjiale/shared'

export const MERCHANT_PAGE_SIZE = 20

/** 商家门店。没有 packages、regionName、testTag。推荐字段只读，不进入 PUT。 */
export interface StoreDetail {
  id: string
  merchantOrgId: string
  name: string
  regionId: number | null
  address: string
  phone: string
  coverUrl: string
  gallery: string[]
  priceText: string
  priceFrom: number | null
  packageText: string
  facilities: string
  features: string
  notice: string
  trafficText: string
  shelfStatus: string
  homeRecommended: boolean
  homeSort: number | null
  version: number | null
}

export interface ShelfApplication {
  id: string
  storeId: string
  storeName: string
  merchantOrgId: string
  action: string
  reason: string
  status: string
  rejectReason: string
  createdAt: string
}

export interface IntentRecord {
  id: string
  intentNo: string
  status: string
  storeId: string
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

export interface MerchantLoginData {
  token: string
  expiresAt: string
  merchantUserId: string
  merchantOrgId: string
  role: string
  displayName: string
}

export interface StoreDraft {
  name: string
  regionId: number | null
  address: string
  phone: string
  coverUrl: string
  galleryText: string
  packageText: string
  facilities: string
  features: string
  notice: string
  trafficText: string
  priceText: string
  priceFromText: string
  version: number | null
}

/**
 * PUT 白名单，与 BE-5 一致。
 * 多带 homeRecommended、homeSort、shelfStatus 时后端返回 400。
 */
export interface StoreUpdateBody {
  name: string
  regionId: number
  address: string
  phone: string
  coverUrl: string
  gallery: string[]
  priceText: string
  priceFrom: number | null
  packageText: string
  facilities: string
  features: string
  notice: string
  trafficText: string
  version: number
}

export const STORE_UPDATE_KEYS = [
  'name',
  'regionId',
  'address',
  'phone',
  'coverUrl',
  'gallery',
  'priceText',
  'priceFrom',
  'packageText',
  'facilities',
  'features',
  'notice',
  'trafficText',
  'version',
] as const

export interface ShelfApplyBody {
  action: 'PUBLISH' | 'UNPUBLISH'
  reason: string
}

export const STORE_UPDATE_FORBIDDEN = ['homeRecommended', 'homeSort', 'shelfStatus'] as const

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function idOf(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function flag(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
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

export function readMerchantPage<T>(data: unknown, mapItem: (item: unknown) => T | null): PageResult<T> {
  const body = record(data)
  if (!body || !Array.isArray(body.items)) {
    throw new Error('列表响应缺少 items')
  }
  const items = body.items.map(mapItem).filter((item): item is T => item !== null)
  return {
    items,
    total: num(body.total) ?? items.length,
    page: num(body.page) ?? 1,
    pageSize: num(body.pageSize) ?? MERCHANT_PAGE_SIZE,
  }
}

export function readStore(value: unknown): StoreDetail | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  return {
    id,
    merchantOrgId: idOf(body.merchantOrgId),
    name: text(body.name),
    regionId: num(body.regionId),
    address: text(body.address),
    phone: text(body.phone),
    coverUrl: text(body.coverUrl),
    gallery: Array.isArray(body.gallery) ? body.gallery.map(text).filter(Boolean) : [],
    priceText: text(body.priceText),
    priceFrom: num(body.priceFrom),
    packageText: text(body.packageText),
    facilities: text(body.facilities),
    features: text(body.features),
    notice: text(body.notice),
    trafficText: text(body.trafficText),
    shelfStatus: text(body.shelfStatus),
    homeRecommended: flag(body.homeRecommended),
    homeSort: num(body.homeSort),
    version: num(body.version),
  }
}

export function readShelfApplication(value: unknown): ShelfApplication | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  return {
    id,
    storeId: idOf(body.storeId),
    storeName: text(body.storeName),
    merchantOrgId: idOf(body.merchantOrgId),
    action: text(body.action),
    reason: text(body.reason),
    status: text(body.status),
    rejectReason: text(body.rejectReason),
    createdAt: readDateTime(body.createdAt),
  }
}

export function readIntent(value: unknown): IntentRecord | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  return {
    id,
    intentNo: text(body.intentNo),
    status: text(body.status),
    storeId: idOf(body.storeId),
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

export function readMerchantLogin(value: unknown): MerchantLoginData {
  const body = record(value)
  const token = text(body?.token)
  if (!body || !token) throw new Error('登录响应缺少令牌')
  const role = text(body.role) || 'MERCHANT'
  if (role !== 'MERCHANT') throw new Error('该账号不是商家账号')
  return {
    token,
    expiresAt: text(body.expiresAt),
    merchantUserId: idOf(body.merchantUserId),
    merchantOrgId: idOf(body.merchantOrgId),
    role,
    displayName: text(body.displayName),
  }
}

export function draftFromDetail(store: StoreDetail): StoreDraft {
  return {
    name: store.name,
    regionId: store.regionId,
    address: store.address,
    phone: store.phone,
    coverUrl: store.coverUrl,
    galleryText: store.gallery.join('\n'),
    packageText: store.packageText,
    facilities: store.facilities,
    features: store.features,
    notice: store.notice,
    trafficText: store.trafficText,
    priceText: store.priceText,
    priceFromText: store.priceFrom === null ? '' : String(store.priceFrom),
    version: store.version,
  }
}

export function buildStoreUpdateBody(draft: StoreDraft): StoreUpdateBody {
  if (draft.version === null) throw new Error('缺少版本号，无法保存')
  if (draft.regionId === null || !Number.isInteger(draft.regionId)) throw new Error('请填写地区编号')
  const priceRaw = draft.priceFromText.trim()
  const priceFrom = priceRaw ? Number(priceRaw) : null
  if (priceRaw && !Number.isFinite(priceFrom)) throw new Error('价格需为数字')
  const body: StoreUpdateBody = {
    name: draft.name.trim(),
    regionId: draft.regionId,
    address: draft.address.trim(),
    phone: draft.phone.trim(),
    coverUrl: draft.coverUrl.trim(),
    gallery: draft.galleryText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    priceText: draft.priceText.trim(),
    priceFrom,
    packageText: draft.packageText.trim(),
    facilities: draft.facilities.trim(),
    features: draft.features.trim(),
    notice: draft.notice.trim(),
    trafficText: draft.trafficText.trim(),
    version: draft.version,
  }
  return body
}

export function buildShelfBody(action: 'PUBLISH' | 'UNPUBLISH', reason: string): ShelfApplyBody {
  return { action, reason: reason.trim() }
}

export function displayContactPhone(value: string | null | undefined): string {
  const raw = value?.trim() ?? ''
  if (!raw) return ''
  if (raw.includes('*')) return raw
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 7) return `${digits.slice(0, 3)}****${digits.slice(-4)}`
  return raw
}

export function intentStatusLabel(status: string): string {
  if (status in INTENT_STATUS_LABEL) return INTENT_STATUS_LABEL[status as IntentStatus]
  return status || '未知状态'
}

export function intentTagType(status: string): 'success' | 'warning' | 'primary' | undefined {
  if (status === 'CHECKED_IN') return 'success'
  if (status === 'PENDING' || status === 'RESCHEDULED') return 'warning'
  if (status === 'CONFIRMED') return 'primary'
  return undefined
}

export function shelfStatusLabel(status: string): string {
  if (status === 'ON_SHELF' || status === 'PUBLISHED') return '已上架'
  if (!status || status === 'OFF_SHELF' || status === 'UNPUBLISHED' || status === 'DRAFT') return '未上架'
  return status
}

export function shelfActionLabel(action: string): string {
  if (action === 'PUBLISH') return '上架'
  if (action === 'UNPUBLISH') return '下架'
  return action || '—'
}

export function shelfStateLabel(status: string): string {
  if (status === 'PENDING') return '待审'
  if (status === 'APPROVED') return '已通过'
  if (status === 'REJECTED') return '已驳回'
  return status || '—'
}

export function shelfTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'PENDING') return 'warning'
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'danger'
  return 'info'
}

export function priceLabel(priceText?: string | null, priceFrom?: number | string | null): string {
  const textValue = priceText?.trim()
  if (textValue) return textValue
  if (priceFrom === null || priceFrom === undefined || priceFrom === '') return ''
  return `¥${priceFrom} 起`
}

export function intentDateLabel(intent: Pick<IntentRecord, 'checkIn' | 'checkOut' | 'nights'>): string {
  if (intent.checkIn && intent.checkOut) return `${intent.checkIn} 至 ${intent.checkOut}`
  if (intent.checkIn && intent.nights) return `${intent.checkIn} · ${intent.nights} 晚`
  if (intent.checkIn) return intent.checkIn
  if (intent.nights) return `${intent.nights} 晚`
  return '—'
}

export function guestLabel(guests: number | null): string {
  if (guests === null) return '—'
  return `${guests} 人`
}

export function validateStoreDraft(draft: StoreDraft): {
  name: string
  regionId: string
  priceFrom: string
  version: string
} {
  const priceRaw = draft.priceFromText.trim()
  return {
    name: draft.name.trim() ? '' : '请填写门店名称',
    regionId: draft.regionId !== null && Number.isInteger(draft.regionId) ? '' : '请填写地区编号',
    priceFrom: priceRaw && !Number.isFinite(Number(priceRaw)) ? '价格需为数字' : '',
    version: draft.version === null ? '缺少版本号，无法保存' : '',
  }
}

export function validateShelfReason(reason: string): string {
  return reason.trim() ? '' : '请填写申请原因'
}
