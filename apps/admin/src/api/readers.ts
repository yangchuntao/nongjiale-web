import {
  INTENT_STATUS_LABEL,
  INTENT_STATUS_TRANSITIONS,
  intentDisplayLabel,
  formatDate,
  formatDateTime,
  normalizeHex,
  normalizeIntentCopy,
  type IntentStatus,
  type PageResult,
} from '@nongjiale/shared'

export const ADMIN_PAGE_SIZE = 20

/** 会话显示名。不是令牌，不能代替 `nj_admin_token`。 */
export const ADMIN_PROFILE_KEY = 'nj_admin_profile'

export const INTENT_CSV_HEADERS = ['单号', '店名', '日期', '人数', '状态', '联系人', '手机', '更新时间'] as const

/** 终态中文。接口或 CSV 若仍给禁词，展示层改成这一句。 */
export const CHECKED_IN_LABEL = INTENT_STATUS_LABEL.CHECKED_IN

export const SHELF_STATUSES = ['DRAFT', 'OFF_SHELF', 'ON_SHELF'] as const

export type ShelfStatus = (typeof SHELF_STATUSES)[number]

export interface AdminLoginData {
  token: string
  expiresAt: string
  adminId: string
  role: string
  displayName: string
}

export interface AdminMe {
  adminId: string
  phone: string
  role: string
  displayName: string
}

export interface MerchantApply {
  id: string
  orgName: string
  contactName: string
  contactPhone: string
  plannedStoreName: string
  regionId: number | null
  description: string
  licenseUrls: string[]
  status: string
  rejectReason: string
  reviewedBy: string
  reviewedAt: string
  createdAt: string
  merchantOrgId: string
}

export interface MerchantUser {
  id: string
  phone: string
  displayName: string
  enabled: boolean
}

export interface MerchantOrg {
  id: string
  name: string
  status: string
  contactName: string
  contactPhone: string
  users: MerchantUser[]
}

export interface StoreDetail {
  id: string
  merchantOrgId: string
  orgName: string
  name: string
  regionId: number | null
  regionName: string
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

export interface ListingDraft {
  name: string
  regionId: number | null
  address: string
  phone: string
  coverUrl: string
  galleryText: string
  priceText: string
  priceFromText: string
  packageText: string
  facilities: string
  features: string
  notice: string
  trafficText: string
  homeRecommended: boolean
  homeSortText: string
  shelfStatus: string
  version: number | null
}

export interface ListingUpdateBody {
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
  homeRecommended: boolean
  homeSort: number
  shelfStatus: ShelfStatus
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
  'homeRecommended',
  'homeSort',
  'shelfStatus',
  'version',
] as const

export const STORE_UPDATE_FORBIDDEN = ['homeRecommendSort', 'amount', 'paymentStatus'] as const

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

export interface IntentNote {
  id: string
  adminId: string
  action: string
  fromStatus: string
  toStatus: string
  note: string
  createdAt: string
}

export interface IntentRecord {
  id: string
  intentNo: string
  status: string
  statusLabel: string
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
  updatedAt: string
  version: number | null
  notes: IntentNote[]
}

export interface IntentFilter {
  status: string
  storeId: string
  merchantOrgId: string
  checkInFrom: string
  checkInTo: string
  createdFrom: string
  createdTo: string
  page: number
}

export interface ArticleRecord {
  id: string
  title: string
  coverUrl: string
  summary: string
  body: string
  status: string
  updatedAt: string
}

export interface ArticleDraft {
  title: string
  coverUrl: string
  summary: string
  body: string
  status: 'DRAFT' | 'PUBLISHED'
}

export interface ArticleBody {
  title: string
  coverUrl: string
  summary: string
  body: string
  status: 'DRAFT' | 'PUBLISHED'
}

export interface SiteConfigRecord {
  siteName: string
  brandColor: string
  contactPhone: string
}

export interface ListingFieldErrors {
  name: string
  regionId: string
  homeSort: string
  priceFrom: string
  shelfStatus: string
  version: string
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
  return formatDate(value)
}

export function readDateTime(value: unknown): string {
  return formatDateTime(value)
}

function readUrlList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean)
  if (typeof value !== 'string') return []
  const trimmed = value.trim()
  if (!trimmed) return []
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) return parsed.map(text).filter(Boolean)
    } catch {
      return []
    }
  }
  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function readEnabled(body: Record<string, unknown>): boolean {
  if (typeof body.enabled === 'boolean') return body.enabled
  if (body.enabled === 'false' || body.enabled === 0 || body.enabled === '0') return false
  if (body.enabled === 'true' || body.enabled === 1 || body.enabled === '1') return true
  if (body.status === 'DISABLED') return false
  if (body.status === 'ACTIVE') return true
  return true
}

export function pageQuery(page = 1, pageSize = ADMIN_PAGE_SIZE): { page: number; pageSize: number } {
  return { page, pageSize }
}

export function readQueryText(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw : ''
}

export function pageFromQuery(value: unknown): number {
  const page = Number(readQueryText(value) || '1')
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
}

export function readPage<T>(data: unknown, mapItem: (item: unknown) => T | null): PageResult<T> {
  const body = record(data)
  if (!body || !Array.isArray(body.items)) throw new Error('列表响应缺少 items')
  const items = body.items.map(mapItem).filter((item): item is T => item !== null)
  return {
    items,
    total: num(body.total) ?? items.length,
    page: num(body.page) ?? 1,
    pageSize: num(body.pageSize) ?? ADMIN_PAGE_SIZE,
  }
}

export function buildLoginBody(phone: string, password: string): { phone: string; password: string } {
  return { phone: phone.trim(), password }
}

export function readAdminLogin(value: unknown): AdminLoginData {
  const body = record(value)
  const token = text(body?.token)
  if (!body || !token) throw new Error('登录响应缺少令牌')
  const role = text(body.role) || 'OPERATOR'
  if (role !== 'OPERATOR' && role !== 'AGENT') throw new Error('该账号不是运营账号')
  return {
    token,
    expiresAt: text(body.expiresAt),
    adminId: idOf(body.adminId),
    role,
    displayName: text(body.displayName),
  }
}

export function readAdminMe(value: unknown): AdminMe {
  const body = record(value)
  const adminId = idOf(body?.adminId)
  if (!body || !adminId) throw new Error('当前用户缺少编号')
  const role = text(body.role)
  if (role !== 'OPERATOR' && role !== 'AGENT') throw new Error('该账号不是运营账号')
  return {
    adminId,
    phone: text(body.phone),
    role,
    displayName: text(body.displayName),
  }
}

export function passwordError(password: string): string {
  if (!password.trim()) return '请输入密码'
  if (password.length < 6 || password.length > 64) return '密码长度需为 6 到 64 位'
  return ''
}

export function rejectReasonError(reason: string): string {
  const trimmed = reason.trim()
  if (!trimmed) return '请填写驳回原因'
  if (trimmed.length > 500) return '驳回原因过长'
  return ''
}

export function buildRejectBody(reason: string): { reason: string } {
  const message = rejectReasonError(reason)
  if (message) throw new Error(message)
  return { reason: reason.trim() }
}

export function readMerchantApply(value: unknown): MerchantApply | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  return {
    id,
    orgName: text(body.orgName),
    contactName: text(body.contactName),
    contactPhone: text(body.contactPhone),
    plannedStoreName: text(body.plannedStoreName),
    regionId: num(body.regionId),
    description: text(body.description),
    licenseUrls: readUrlList(body.licenseUrls),
    status: text(body.status),
    rejectReason: text(body.rejectReason),
    reviewedBy: idOf(body.reviewedBy),
    reviewedAt: readDateTime(body.reviewedAt),
    createdAt: readDateTime(body.createdAt),
    merchantOrgId: idOf(body.merchantOrgId),
  }
}

function readMerchantUser(value: unknown): MerchantUser | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  return {
    id,
    phone: text(body.phone),
    displayName: text(body.displayName),
    enabled: readEnabled(body),
  }
}

export function readMerchantOrg(value: unknown): MerchantOrg | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  const users = Array.isArray(body.users)
    ? body.users.map(readMerchantUser).filter((item): item is MerchantUser => item !== null)
    : []
  return {
    id,
    name: text(body.name) || text(body.orgName),
    status: text(body.status),
    contactName: text(body.contactName),
    contactPhone: text(body.contactPhone),
    users,
  }
}

export function buildMerchantStatusBody(status: 'ACTIVE' | 'DISABLED'): { status: 'ACTIVE' | 'DISABLED' } {
  return { status }
}

export function buildOptionalPassword(password: string): { password?: string } {
  if (!password.trim()) return {}
  const message = passwordError(password)
  if (message) throw new Error(message)
  return { password }
}

export function readPlainPassword(data: unknown): { plainPassword: string; phone: string; merchantOrgId: string; merchantUserId: string } {
  const body = record(data)
  const plainPassword = text(body?.plainPassword)
  if (!body || !plainPassword) throw new Error('响应缺少一次性密码')
  return {
    plainPassword,
    phone: text(body.phone),
    merchantOrgId: idOf(body.merchantOrgId),
    merchantUserId: idOf(body.merchantUserId),
  }
}

export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint32Array(10)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (value) => alphabet[value % alphabet.length] ?? 'a').join('')
}

export function readStore(value: unknown): StoreDetail | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  return {
    id,
    merchantOrgId: idOf(body.merchantOrgId),
    orgName: text(body.orgName) || text(body.merchantOrgName),
    name: text(body.name),
    regionId: num(body.regionId),
    regionName: text(body.regionName),
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

export function draftFromStore(store: StoreDetail): ListingDraft {
  return {
    name: store.name,
    regionId: store.regionId,
    address: store.address,
    phone: store.phone,
    coverUrl: store.coverUrl,
    galleryText: store.gallery.join('\n'),
    priceText: store.priceText,
    priceFromText: store.priceFrom === null ? '' : String(store.priceFrom),
    packageText: store.packageText,
    facilities: store.facilities,
    features: store.features,
    notice: store.notice,
    trafficText: store.trafficText,
    homeRecommended: store.homeRecommended,
    homeSortText: store.homeSort === null ? '' : String(store.homeSort),
    shelfStatus: store.shelfStatus,
    version: store.version,
  }
}

export function listingErrors(draft: ListingDraft): ListingFieldErrors {
  const priceRaw = draft.priceFromText.trim()
  const sortRaw = draft.homeSortText.trim()
  const sort = Number(sortRaw)
  return {
    name: draft.name.trim() ? '' : '请填写房源名称',
    regionId: draft.regionId !== null && Number.isInteger(draft.regionId) ? '' : '请填写地区编号',
    homeSort: !sortRaw ? '请填写排序权重' : Number.isInteger(sort) ? '' : '排序权重须为整数',
    priceFrom: priceRaw && !Number.isFinite(Number(priceRaw)) ? '价格需为数字' : '',
    shelfStatus: (SHELF_STATUSES as readonly string[]).includes(draft.shelfStatus) ? '' : '上架状态不正确',
    version: draft.version === null ? '缺少版本号，无法保存' : '',
  }
}

export function buildListingBody(draft: ListingDraft): ListingUpdateBody {
  const errors = listingErrors(draft)
  const message = errors.homeSort || errors.name || errors.regionId || errors.priceFrom || errors.shelfStatus || errors.version
  if (message) throw new Error(message)
  const priceRaw = draft.priceFromText.trim()
  return {
    name: draft.name.trim(),
    regionId: draft.regionId ?? 0,
    address: draft.address.trim(),
    phone: draft.phone.trim(),
    coverUrl: draft.coverUrl.trim(),
    gallery: draft.galleryText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    priceText: draft.priceText.trim(),
    priceFrom: priceRaw ? Number(priceRaw) : null,
    packageText: draft.packageText.trim(),
    facilities: draft.facilities.trim(),
    features: draft.features.trim(),
    notice: draft.notice.trim(),
    trafficText: draft.trafficText.trim(),
    homeRecommended: draft.homeRecommended,
    homeSort: Number(draft.homeSortText.trim()),
    shelfStatus: draft.shelfStatus as ShelfStatus,
    version: draft.version ?? 0,
  }
}

export function storeListQuery(filter: {
  regionId: string
  shelfStatus: string
  homeRecommended: string
  merchantOrgId: string
  name: string
  page: number
}): Record<string, string | number> {
  const query: Record<string, string | number> = { page: filter.page, pageSize: ADMIN_PAGE_SIZE }
  if (/^[1-9]\d*$/.test(filter.regionId.trim())) query.regionId = filter.regionId.trim()
  if (filter.shelfStatus) query.shelfStatus = filter.shelfStatus
  if (filter.homeRecommended === 'true' || filter.homeRecommended === 'false') {
    query.homeRecommended = filter.homeRecommended
  }
  if (/^[1-9]\d*$/.test(filter.merchantOrgId.trim())) query.merchantOrgId = filter.merchantOrgId.trim()
  if (filter.name.trim()) query.name = filter.name.trim()
  return query
}

export function reviewListQuery(status: string, page: number): Record<string, string | number> {
  const query: Record<string, string | number> = { page, pageSize: ADMIN_PAGE_SIZE }
  if (status && status !== 'ALL') query.status = status
  return query
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

function readNote(value: unknown): IntentNote | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  return {
    id,
    adminId: idOf(body.adminId),
    action: text(body.action),
    fromStatus: text(body.fromStatus),
    toStatus: text(body.toStatus),
    note: text(body.note),
    createdAt: readDateTime(body.createdAt),
  }
}

export function readIntent(value: unknown): IntentRecord | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  const notes = Array.isArray(body.notes)
    ? body.notes.map(readNote).filter((item): item is IntentNote => item !== null)
    : []
  return {
    id,
    intentNo: text(body.intentNo),
    status: text(body.status),
    statusLabel: text(body.statusLabel),
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
    updatedAt: readDateTime(body.updatedAt),
    version: num(body.version),
    notes,
  }
}

export function intentStatusLabel(status: string): string {
  return intentDisplayLabel(status)
}

export function displayIntentStatus(status: string, statusLabel?: string | null): string {
  return intentDisplayLabel(status, statusLabel)
}

export function nextIntentStatuses(status: string): IntentStatus[] {
  if (!(status in INTENT_STATUS_TRANSITIONS)) return []
  return [...INTENT_STATUS_TRANSITIONS[status as IntentStatus]]
}

export function intentTagType(status: string): 'success' | 'warning' | 'info' {
  if (status === 'CHECKED_IN') return 'success'
  if (status === 'PENDING' || status === 'RESCHEDULED') return 'warning'
  if (status === 'CONFIRMED') return 'info'
  return 'info'
}

/** 已关闭等非信息色状态。CONFIRMED 保持 info，不用 primary。 */
export function intentTagMuted(status: string): boolean {
  return status !== 'CHECKED_IN' && status !== 'PENDING' && status !== 'RESCHEDULED' && status !== 'CONFIRMED'
}

export function buildIntentStatusBody(
  status: IntentStatus,
  version: number | null,
  note: string,
): { targetStatus: IntentStatus; version: number; note?: string } {
  if (version === null) throw new Error('缺少版本号，无法变更状态')
  const trimmed = note.trim()
  if (trimmed.length > 1000) throw new Error('备注过长')
  if (trimmed) return { targetStatus: status, version, note: trimmed }
  return { targetStatus: status, version }
}

export function buildIntentNoteBody(note: string): { note: string } {
  const trimmed = note.trim()
  if (!trimmed) throw new Error('请填写备注')
  if (trimmed.length > 1000) throw new Error('备注过长')
  return { note: trimmed }
}

export function intentListQuery(filter: IntentFilter): Record<string, string | number> {
  const query: Record<string, string | number> = { page: filter.page, pageSize: ADMIN_PAGE_SIZE }
  if (filter.status) query.status = filter.status
  if (/^[1-9]\d*$/.test(filter.storeId.trim())) query.storeId = filter.storeId.trim()
  if (/^[1-9]\d*$/.test(filter.merchantOrgId.trim())) query.merchantOrgId = filter.merchantOrgId.trim()
  if (filter.checkInFrom) query.checkInFrom = filter.checkInFrom
  if (filter.checkInTo) query.checkInTo = filter.checkInTo
  if (filter.createdFrom) query.createdFrom = filter.createdFrom
  if (filter.createdTo) query.createdTo = filter.createdTo
  return query
}

export function intentExportQuery(filter: IntentFilter): Record<string, string> {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(intentListQuery(filter))) {
    if (key === 'page' || key === 'pageSize') continue
    query[key] = String(value)
  }
  return query
}

export function intentDateLabel(intent: Pick<IntentRecord, 'checkIn' | 'checkOut' | 'nights'>): string {
  if (intent.checkIn && intent.checkOut) return `${intent.checkIn} 至 ${intent.checkOut}`
  if (intent.checkIn && intent.nights) return `${intent.checkIn} · ${intent.nights} 晚`
  if (intent.checkIn) return intent.checkIn
  if (intent.nights) return `${intent.nights} 晚`
  return ''
}

export function guestLabel(guests: number | null): string {
  if (guests === null) return '—'
  return `${guests} 人`
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function intentsToCsv(rows: IntentRecord[]): string {
  const lines = [INTENT_CSV_HEADERS.join(',')]
  for (const row of rows) {
    lines.push(
      [
        row.intentNo,
        row.storeName,
        intentDateLabel(row),
        row.guests === null ? '' : String(row.guests),
        displayIntentStatus(row.status, row.statusLabel),
        row.contactName,
        row.contactPhone,
        row.updatedAt,
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return lines.join('\n')
}

export function presentIntentCsv(csv: string): string {
  return normalizeIntentCopy(csv)
}

export function intentExportFilename(status: string, day: string): string {
  return `intents-${status || 'all'}-${day}.csv`
}

export function readArticle(value: unknown): ArticleRecord | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  return {
    id,
    title: text(body.title),
    coverUrl: text(body.coverUrl) || text(body.cover),
    summary: text(body.summary),
    body: text(body.body) || text(body.content),
    status: text(body.status),
    updatedAt: readDateTime(body.updatedAt),
  }
}

export function articleErrors(draft: ArticleDraft): { title: string } {
  return { title: draft.title.trim() ? '' : '请填写标题' }
}

export function buildArticleBody(draft: ArticleDraft): ArticleBody {
  const message = articleErrors(draft).title
  if (message) throw new Error(message)
  return {
    title: draft.title.trim(),
    coverUrl: draft.coverUrl.trim(),
    summary: draft.summary.trim(),
    body: draft.body.trim(),
    status: draft.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
  }
}

export function draftFromArticle(article: ArticleRecord): ArticleDraft {
  return {
    title: article.title,
    coverUrl: article.coverUrl,
    summary: article.summary,
    body: article.body,
    status: article.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
  }
}

export function readSiteConfig(value: unknown): SiteConfigRecord {
  if (Array.isArray(value)) {
    const map = new Map<string, string>()
    for (const item of value) {
      const row = record(item)
      if (!row) continue
      const key = text(row.configKey) || text(row.key)
      if (key) map.set(key, text(row.configValue) || text(row.value))
    }
    return {
      siteName: map.get('site.name') ?? '',
      brandColor: map.get('site.brand_color') ?? '',
      contactPhone: map.get('site.contact_phone') ?? '',
    }
  }
  const body = record(value)
  return {
    siteName: text(body?.siteName),
    brandColor: text(body?.brandColor),
    contactPhone: text(body?.contactPhone),
  }
}

const SITE_PHONE = /^[0-9+\-()（）\s]{5,32}$/

export function siteConfigErrors(draft: SiteConfigRecord): {
  siteName: string
  brandColor: string
  contactPhone: string
} {
  const phone = draft.contactPhone.trim()
  return {
    siteName: draft.siteName.trim() ? '' : '请填写站名',
    brandColor: normalizeHex(draft.brandColor) ? '' : '请填写合法的主色',
    contactPhone: !phone ? '请填写客服电话' : SITE_PHONE.test(phone) ? '' : '请填写合法的客服电话',
  }
}

export function buildSiteConfigBody(draft: SiteConfigRecord): SiteConfigRecord {
  const errors = siteConfigErrors(draft)
  const message = errors.brandColor || errors.siteName || errors.contactPhone
  if (message) throw new Error(message)
  return {
    siteName: draft.siteName.trim(),
    brandColor: normalizeHex(draft.brandColor) ?? '',
    contactPhone: draft.contactPhone.trim(),
  }
}

export function shelfStatusLabel(status: string): string {
  if (status === 'ON_SHELF') return '已上架'
  if (status === 'OFF_SHELF') return '已下架'
  if (status === 'DRAFT') return '草稿'
  return status || '—'
}

export function shelfActionLabel(action: string): string {
  if (action === 'PUBLISH') return '上架'
  if (action === 'UNPUBLISH') return '下架'
  return action || '—'
}

export function reviewStatusLabel(status: string): string {
  if (status === 'PENDING') return '待审'
  if (status === 'APPROVED') return '已通过'
  if (status === 'REJECTED') return '已驳回'
  return status || '—'
}

export function reviewTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'PENDING') return 'warning'
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'danger'
  return 'info'
}

export function articleStatusLabel(status: string): string {
  if (status === 'DRAFT') return '草稿'
  if (status === 'PUBLISHED') return '已发布'
  return status || '—'
}

export function regionLabel(store: Pick<StoreDetail, 'regionName' | 'regionId'>): string {
  if (store.regionName) return store.regionName
  if (store.regionId !== null) return String(store.regionId)
  return '—'
}

export function orgLabel(value: { name?: string; orgName?: string; merchantOrgId?: string }): string {
  return value.name || value.orgName || value.merchantOrgId || '—'
}

export function noteHeading(note: IntentNote): string {
  const who = note.adminId ? `运营 ${note.adminId}` : '运营'
  const action = note.action === 'STATUS_CHANGE' ? '变更状态' : note.action === 'COMMENT' ? '备注' : ''
  const whoLine = action ? `${who} · ${action}` : who
  if (!note.fromStatus && !note.toStatus) return whoLine
  const from = note.fromStatus ? displayIntentStatus(note.fromStatus) : '—'
  const to = note.toStatus ? displayIntentStatus(note.toStatus) : '—'
  return `${whoLine} · ${from} → ${to}`
}

export function todayIso(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export type CityOpenStatus = 'OPEN' | 'CLOSED'

export interface CitySummary {
  id: string
  provinceName: string
  name: string
  slug: string
  openStatus: CityOpenStatus
  storeCount: number
  articleCount: number
  updatedAt: string
}

export interface CityChecklist {
  destinationReady: boolean
  supplyReady: boolean
  articlesReady: boolean
  supportCovered: boolean
  dirtyDataCleared: boolean
}

export interface CityDetail extends CitySummary {
  enabled: boolean
  minStores: number
  minArticles: number
  checklist: CityChecklist
  canOpen: boolean
  canClose: boolean
  missingReasons: string[]
  version: number
  updatedBy: string
}

export type CityHandKey = 'destinationReady' | 'supportCovered' | 'dirtyDataCleared'

export interface CityChecklistPatch {
  version: number
  destinationReady?: boolean
  supportCovered?: boolean
  dirtyDataCleared?: boolean
}

export interface CityListFilter {
  status: string
  province: string
  keyword: string
}

export type CityIntentWindow = '7' | '30' | 'ALL'

export interface CityIntentQuery {
  window: CityIntentWindow
  cityId: string
}

export interface CityIntentRow {
  cityId: string | null
  cityName: string
  intentCount: number
  confirmedCount: number
  checkedInCount: number
  total: boolean
}

export interface CityIntentMetrics {
  window: CityIntentWindow
  from: string
  rows: CityIntentRow[]
}

function countOf(value: unknown): number {
  const parsed = num(value)
  if (parsed === null || parsed < 0) return 0
  return Math.trunc(parsed)
}

function positiveInt(value: unknown, fallback: number): number {
  const parsed = num(value)
  if (parsed === null || !Number.isInteger(parsed) || parsed <= 0) return fallback
  return parsed
}

function readOpenStatus(value: unknown): CityOpenStatus {
  return value === 'OPEN' ? 'OPEN' : 'CLOSED'
}

export function cityTitle(city: Pick<CitySummary, 'provinceName' | 'name'>): string {
  if (city.provinceName && city.name) return `${city.provinceName} · ${city.name}`
  return city.name || city.provinceName || '—'
}

export function cityUpdatedLabel(value: string): string {
  return value || '—'
}

export function openStatusLabel(status: string): string {
  return status === 'OPEN' ? '已开通' : '未开通'
}

export function readCitySummary(value: unknown): CitySummary | null {
  const body = record(value)
  const id = idOf(body?.id)
  if (!body || !id) return null
  return {
    id,
    provinceName: text(body.provinceName),
    name: text(body.name),
    slug: text(body.slug),
    openStatus: readOpenStatus(body.openStatus),
    storeCount: countOf(body.storeCount),
    articleCount: countOf(body.articleCount),
    updatedAt: readDateTime(body.updatedAt),
  }
}

export function readCityList(data: unknown): CitySummary[] {
  if (!Array.isArray(data)) return []
  return data.map(readCitySummary).filter((item): item is CitySummary => item !== null)
}

export function readCityDetail(value: unknown): CityDetail | null {
  const summary = readCitySummary(value)
  const body = record(value)
  if (!summary || !body) return null
  const checklistBody = record(body.checklist) ?? {}
  const minStores = positiveInt(body.minStores, 5)
  const minArticles = positiveInt(body.minArticles, 1)
  const destinationReady = checklistBody.destinationReady === true
  const supportCovered = checklistBody.supportCovered === true
  const dirtyDataCleared = checklistBody.dirtyDataCleared === true
  const supplyReady = typeof checklistBody.supplyReady === 'boolean' ? checklistBody.supplyReady : summary.storeCount >= minStores
  const articlesReady = typeof checklistBody.articlesReady === 'boolean' ? checklistBody.articlesReady : summary.articleCount >= minArticles
  const derivedOpen =
    summary.openStatus !== 'OPEN' && destinationReady && supportCovered && dirtyDataCleared && supplyReady && articlesReady
  const missingReasons = Array.isArray(body.missingReasons) ? body.missingReasons.map(text).filter(Boolean) : []
  return {
    ...summary,
    enabled: body.enabled !== false,
    minStores,
    minArticles,
    checklist: {
      destinationReady,
      supplyReady,
      articlesReady,
      supportCovered,
      dirtyDataCleared,
    },
    canOpen: typeof body.canOpen === 'boolean' ? body.canOpen : derivedOpen,
    canClose: typeof body.canClose === 'boolean' ? body.canClose : summary.openStatus === 'OPEN',
    missingReasons,
    version: Math.max(0, Math.trunc(num(body.version) ?? 0)),
    updatedBy: idOf(body.updatedBy),
  }
}

export function filterCities(cities: CitySummary[], filter: CityListFilter): CitySummary[] {
  const keyword = filter.keyword.trim()
  return cities.filter((city) => {
    if ((filter.status === 'OPEN' || filter.status === 'CLOSED') && city.openStatus !== filter.status) return false
    if (filter.province && city.provinceName !== filter.province) return false
    if (keyword && !`${city.provinceName}${city.name}${city.slug}`.includes(keyword)) return false
    return true
  })
}

export function buildChecklistPatch(
  version: number,
  patch: Partial<Record<CityHandKey, boolean>>,
): CityChecklistPatch {
  if (!Number.isInteger(version) || version < 0) throw new Error('缺少版本号，无法保存')
  const body: CityChecklistPatch = { version }
  let changed = 0
  for (const key of ['destinationReady', 'supportCovered', 'dirtyDataCleared'] as const) {
    if (typeof patch[key] === 'boolean') {
      body[key] = patch[key]
      changed += 1
    }
  }
  if (!changed) throw new Error('请指定要更新的项')
  return body
}

export function buildCityVersionBody(version: number): { version: number } {
  if (!Number.isInteger(version) || version < 0) throw new Error('缺少版本号，无法保存')
  return { version }
}

export function cityIntentQuery(filter: CityIntentQuery): Record<string, string> {
  const window: CityIntentWindow = filter.window === '30' || filter.window === 'ALL' ? filter.window : '7'
  const query: Record<string, string> = { window }
  if (/^[1-9]\d*$/.test(filter.cityId.trim())) query.cityId = filter.cityId.trim()
  return query
}

function readCityIntentRow(value: unknown): CityIntentRow | null {
  const body = record(value)
  if (!body) return null
  const total = body.total === true
  const cityId = total ? null : idOf(body.cityId) || null
  return {
    cityId,
    cityName: text(body.cityName) || (total ? '合计' : '—'),
    intentCount: countOf(body.intentCount),
    confirmedCount: countOf(body.confirmedCount),
    checkedInCount: countOf(body.checkedInCount),
    total,
  }
}

export function readCityIntentMetrics(value: unknown): CityIntentMetrics {
  const body = record(value)
  if (!body || !Array.isArray(body.rows)) throw new Error('指标响应缺少 rows')
  const windowRaw = text(body.window)
  const window: CityIntentWindow = windowRaw === '30' || windowRaw === 'ALL' ? windowRaw : '7'
  return {
    window,
    from: readDateTime(body.from),
    rows: body.rows.map(readCityIntentRow).filter((row): row is CityIntentRow => row !== null),
  }
}

export function cityIntentTotal(metrics: CityIntentMetrics): CityIntentRow {
  return (
    metrics.rows.find((row) => row.total) ?? {
      cityId: null,
      cityName: '合计',
      intentCount: 0,
      confirmedCount: 0,
      checkedInCount: 0,
      total: true,
    }
  )
}

export function cityIntentCities(metrics: CityIntentMetrics): CityIntentRow[] {
  return metrics.rows.filter((row) => !row.total)
}
