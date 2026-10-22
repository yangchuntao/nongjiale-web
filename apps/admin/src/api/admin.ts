import type { IntentStatus, PageResult, PhonePasswordCredentials } from '@nongjiale/shared'
import { http, requestCsv } from './client'
import {
  ADMIN_API,
  adminApplyApprovePath,
  adminApplyPath,
  adminApplyRejectPath,
  adminArticlePath,
  adminBannerDisablePath,
  adminBannerEnablePath,
  adminBannerPath,
  adminCityChecklistPath,
  adminCityClosePath,
  adminCityOpenPath,
  adminCityPath,
  adminIntentNotesPath,
  adminIntentPath,
  adminIntentStatusPath,
  adminMerchantPath,
  adminResetPasswordPath,
  adminShelfApprovePath,
  adminShelfRejectPath,
  adminStorePath,
} from './paths'
import {
  bannerListQuery,
  buildArticleBody,
  buildBannerBody,
  buildCityVersionBody,
  buildIntentNoteBody,
  buildIntentStatusBody,
  buildListingBody,
  buildLoginBody,
  buildMerchantStatusBody,
  buildOptionalPassword,
  buildRejectBody,
  buildSiteConfigBody,
  cityIntentQuery,
  cityListQuery,
  intentExportQuery,
  intentListQuery,
  presentIntentCsv,
  readAdminLogin,
  readAdminMe,
  readArticle,
  readBanner,
  readCityDetail,
  readCityIntentMetrics,
  readCitySummary,
  readIntent,
  readMerchantApply,
  readMerchantOrg,
  readPage,
  readPlainPassword,
  readQueueCounts,
  readShelfApplication,
  readSiteConfig,
  readStore,
  reviewListQuery,
  storeListQuery,
  type AdminLoginData,
  type AdminMe,
  type ArticleDraft,
  type BannerDraft,
  type BannerListFilter,
  type BannerRecord,
  type CityChecklistPatch,
  type CityDetail,
  type CityIntentMetrics,
  type CityIntentQuery,
  type CitySummary,
  type ArticleRecord,
  type IntentFilter,
  type IntentRecord,
  type ListingDraft,
  type MerchantApply,
  type MerchantOrg,
  type QueueCounts,
  type ShelfApplication,
  type SiteConfigRecord,
  type StoreDetail,
} from './readers'

export async function loginAdmin(body: PhonePasswordCredentials): Promise<AdminLoginData> {
  const data = await http.request<unknown>(ADMIN_API.login, {
    method: 'POST',
    body: buildLoginBody(body.phone, body.password),
  })
  return readAdminLogin(data)
}

export async function fetchApplies(
  status: string,
  page: number,
  signal?: AbortSignal,
): Promise<PageResult<MerchantApply>> {
  const data = await http.request<unknown>(ADMIN_API.merchantApplies, {
    query: reviewListQuery(status, page),
    signal,
  })
  return readPage(data, readMerchantApply)
}

export async function fetchApply(id: string, signal?: AbortSignal): Promise<MerchantApply> {
  const data = await http.request<unknown>(adminApplyPath(id), { signal })
  const apply = readMerchantApply(data)
  if (!apply) throw new Error('入驻申请缺少编号')
  return apply
}

/** 运营代商家录入入驻申请的表单体（字段与门户提交 DTO 对齐）。 */
export interface ApplyCreateDraft {
  orgName: string
  contactName: string
  contactPhone: string
  plannedStoreName: string
  regionId: string
  description: string
}

/** 校验代录入表单，返回逐字段错误信息。 */
export function applyCreateErrors(draft: ApplyCreateDraft): Partial<Record<keyof ApplyCreateDraft, string>> {
  const errors: Partial<Record<keyof ApplyCreateDraft, string>> = {}
  if (!draft.orgName.trim()) errors.orgName = '请填写主体名称'
  else if (draft.orgName.trim().length > 128) errors.orgName = '主体名称过长（最多 128 字）'
  if (draft.contactName.trim().length > 64) errors.contactName = '联系人过长（最多 64 字）'
  if (draft.contactPhone.trim() && !/^1\d{10}$/.test(draft.contactPhone.trim())) {
    errors.contactPhone = '请输入 11 位手机号'
  }
  if (draft.plannedStoreName.trim().length > 128) errors.plannedStoreName = '门店名过长（最多 128 字）'
  if (draft.description.trim().length > 1000) errors.description = '介绍过长（最多 1000 字）'
  return errors
}

function buildApplyCreateBody(draft: ApplyCreateDraft): Record<string, unknown> {
  const errors = applyCreateErrors(draft)
  const first = (Object.keys(errors) as (keyof ApplyCreateDraft)[]).find((key) => errors[key])
  if (first) throw new Error(errors[first])
  const body: Record<string, unknown> = {
    orgName: draft.orgName.trim(),
    contactName: draft.contactName.trim(),
    contactPhone: draft.contactPhone.trim(),
    plannedStoreName: draft.plannedStoreName.trim(),
    description: draft.description.trim(),
  }
  const regionId = draft.regionId.trim()
  if (regionId && !Number.isNaN(Number(regionId))) body.regionId = Number(regionId)
  return body
}

/** 代商家录入入驻申请：落 PENDING 记录并标记来源 ADMIN，返回新申请 ID。 */
export async function createApplyForMerchant(draft: ApplyCreateDraft): Promise<string> {
  const data = await http.request<{ id?: unknown }>(ADMIN_API.merchantApplies, {
    method: 'POST',
    body: buildApplyCreateBody(draft),
  })
  const id = typeof data?.id === 'number' ? String(data.id) : typeof data?.id === 'string' ? data.id : ''
  if (!id) throw new Error('入驻申请响应缺少编号')
  return id
}

export async function fetchAdminMe(signal?: AbortSignal): Promise<AdminMe> {
  const data = await http.request<unknown>(ADMIN_API.me, { signal })
  return readAdminMe(data)
}

export async function approveApply(id: string, password = ''): Promise<{ plainPassword: string; phone: string }> {
  const data = await http.request<unknown>(adminApplyApprovePath(id), {
    method: 'POST',
    body: buildOptionalPassword(password),
  })
  return readPlainPassword(data)
}

export async function rejectApply(id: string, reason: string): Promise<void> {
  await http.request<unknown>(adminApplyRejectPath(id), { method: 'POST', body: buildRejectBody(reason) })
}

export async function fetchMerchants(
  status: string,
  page: number,
  signal?: AbortSignal,
): Promise<PageResult<MerchantOrg>> {
  const data = await http.request<unknown>(ADMIN_API.merchants, {
    query: reviewListQuery(status, page),
    signal,
  })
  return readPage(data, readMerchantOrg)
}

export async function setMerchantStatus(orgId: string, status: 'ACTIVE' | 'DISABLED'): Promise<void> {
  await http.request<unknown>(adminMerchantPath(orgId), {
    method: 'PATCH',
    body: buildMerchantStatusBody(status),
  })
}

export async function resetMerchantPassword(
  orgId: string,
  password = '',
): Promise<{ plainPassword: string; phone: string }> {
  const data = await http.request<unknown>(adminResetPasswordPath(orgId), {
    method: 'POST',
    body: buildOptionalPassword(password),
  })
  return readPlainPassword(data)
}

export async function fetchStores(
  filter: {
    regionId: string
    shelfStatus: string
    homeRecommended: string
    merchantOrgId: string
    name: string
    page: number
  },
  signal?: AbortSignal,
): Promise<PageResult<StoreDetail>> {
  const data = await http.request<unknown>(ADMIN_API.stores, {
    query: storeListQuery(filter),
    signal,
  })
  return readPage(data, readStore)
}

export async function fetchStore(id: string, signal?: AbortSignal): Promise<StoreDetail> {
  const data = await http.request<unknown>(adminStorePath(id), { signal })
  const store = readStore(data)
  if (!store) throw new Error('房源详情缺少编号')
  return store
}

export async function updateStore(id: string, draft: ListingDraft): Promise<StoreDetail | null> {
  const data = await http.request<unknown>(adminStorePath(id), {
    method: 'PUT',
    body: buildListingBody(draft),
  })
  if (data === null || data === undefined) return null
  return readStore(data)
}

export async function fetchShelfQueue(
  status: string,
  page: number,
  signal?: AbortSignal,
): Promise<PageResult<ShelfApplication>> {
  const data = await http.request<unknown>(ADMIN_API.shelfApplications, {
    query: reviewListQuery(status, page),
    signal,
  })
  return readPage(data, readShelfApplication)
}

export async function approveShelf(id: string): Promise<void> {
  await http.request<unknown>(adminShelfApprovePath(id), { method: 'POST' })
}

export async function rejectShelf(id: string, reason: string): Promise<void> {
  await http.request<unknown>(adminShelfRejectPath(id), { method: 'POST', body: buildRejectBody(reason) })
}

export async function fetchIntents(filter: IntentFilter, signal?: AbortSignal): Promise<PageResult<IntentRecord>> {
  const data = await http.request<unknown>(ADMIN_API.intents, {
    query: intentListQuery(filter),
    signal,
  })
  return readPage(data, readIntent)
}

export async function fetchIntent(id: string, signal?: AbortSignal): Promise<IntentRecord> {
  const data = await http.request<unknown>(adminIntentPath(id), { signal })
  const intent = readIntent(data)
  if (!intent) throw new Error('意向详情缺少编号')
  return intent
}

export async function changeIntentStatus(
  id: string,
  status: IntentStatus,
  version: number | null,
  note: string,
): Promise<void> {
  await http.request<unknown>(adminIntentStatusPath(id), {
    method: 'POST',
    body: buildIntentStatusBody(status, version, note),
  })
}

export async function appendIntentNote(id: string, note: string): Promise<void> {
  await http.request<unknown>(adminIntentNotesPath(id), {
    method: 'POST',
    body: buildIntentNoteBody(note),
  })
}

export async function exportIntents(filter: IntentFilter): Promise<string> {
  const csv = await requestCsv(ADMIN_API.intentExport, intentExportQuery(filter))
  return presentIntentCsv(csv)
}

export async function fetchArticles(page: number, signal?: AbortSignal): Promise<PageResult<ArticleRecord>> {
  const data = await http.request<unknown>(ADMIN_API.articles, {
    query: reviewListQuery('ALL', page),
    signal,
  })
  return readPage(data, readArticle)
}

export async function fetchArticle(id: string, signal?: AbortSignal): Promise<ArticleRecord> {
  const data = await http.request<unknown>(adminArticlePath(id), { signal })
  const article = readArticle(data)
  if (!article) throw new Error('攻略详情缺少编号')
  return article
}

export async function createArticle(draft: ArticleDraft): Promise<ArticleRecord> {
  const data = await http.request<unknown>(ADMIN_API.articles, {
    method: 'POST',
    body: buildArticleBody(draft),
  })
  const article = readArticle(data)
  if (!article) throw new Error('攻略响应缺少编号')
  return article
}

export async function updateArticle(id: string, draft: ArticleDraft): Promise<ArticleRecord | null> {
  const data = await http.request<unknown>(adminArticlePath(id), {
    method: 'PUT',
    body: buildArticleBody(draft),
  })
  if (data === null || data === undefined) return null
  return readArticle(data)
}

export async function deleteArticle(id: string): Promise<void> {
  await http.request<unknown>(adminArticlePath(id), { method: 'DELETE' })
}

export async function fetchBanners(
  filter: BannerListFilter,
  signal?: AbortSignal,
): Promise<PageResult<BannerRecord>> {
  const data = await http.request<unknown>(ADMIN_API.banners, {
    query: bannerListQuery(filter),
    signal,
  })
  return readPage(data, readBanner)
}

export async function fetchBanner(id: string, signal?: AbortSignal): Promise<BannerRecord> {
  const data = await http.request<unknown>(adminBannerPath(id), { signal })
  const banner = readBanner(data)
  if (!banner) throw new Error('Banner 缺少编号')
  return banner
}

export async function createBanner(draft: BannerDraft): Promise<BannerRecord> {
  const data = await http.request<unknown>(ADMIN_API.banners, {
    method: 'POST',
    body: buildBannerBody(draft),
  })
  const banner = readBanner(data)
  if (!banner) throw new Error('Banner 响应缺少编号')
  return banner
}

export async function updateBanner(id: string, draft: BannerDraft): Promise<BannerRecord | null> {
  const data = await http.request<unknown>(adminBannerPath(id), {
    method: 'PUT',
    body: buildBannerBody(draft),
  })
  if (data === null || data === undefined) return null
  return readBanner(data)
}

export async function enableBanner(id: string): Promise<void> {
  await http.request<unknown>(adminBannerEnablePath(id), { method: 'POST' })
}

export async function disableBanner(id: string): Promise<void> {
  await http.request<unknown>(adminBannerDisablePath(id), { method: 'POST' })
}

export async function deleteBanner(id: string): Promise<void> {
  await http.request<unknown>(adminBannerPath(id), { method: 'DELETE' })
}

export async function fetchSiteConfig(signal?: AbortSignal): Promise<SiteConfigRecord> {
  const data = await http.request<unknown>(ADMIN_API.siteConfig, { signal })
  return readSiteConfig(data)
}

export interface CityListQuery {
  page?: number
  pageSize?: number
  status?: string
  province?: string
  keyword?: string
}

/** 开城列表（分页 + 筛选）。 */
export async function fetchCities(query: CityListQuery, signal?: AbortSignal): Promise<PageResult<CitySummary>> {
  const data = await http.request<unknown>(ADMIN_API.cities, { query: cityListQuery(query), signal })
  return readPage(data, readCitySummary)
}

/**
 * 城市下拉选项：翻页拉全启用市（全国区划同步后可能超过单页 100 的上限）。
 * 上限 10 页（1000 个市）防御异常数据。
 */
export async function fetchCityOptions(signal?: AbortSignal): Promise<CitySummary[]> {
  const PAGE_SIZE = 100
  const MAX_PAGES = 10
  const items: CitySummary[] = []
  let total = Infinity
  for (let page = 1; items.length < total && page <= MAX_PAGES; page++) {
    const result = await fetchCities({ page, pageSize: PAGE_SIZE }, signal)
    total = result.total
    items.push(...result.items)
    if (result.items.length < PAGE_SIZE) break
  }
  return items
}

/** 工作台待办队列计数（待跟进意向 / 待审入驻 / 待审上下架）。 */
export async function fetchQueueCounts(signal?: AbortSignal): Promise<QueueCounts> {
  const data = await http.request<unknown>(ADMIN_API.queueCounts, { signal })
  return readQueueCounts(data)
}

export interface RegionSyncResult {
  total: number
  inserted: number
  updated: number
  skipped: number
  message: string
}

/** 把内置的全国省市区数据同步进库。幂等，不覆盖开城状态。 */
export async function syncRegions(): Promise<RegionSyncResult> {
  const data = await http.request<Record<string, unknown>>(ADMIN_API.regionSync, { method: 'POST' })
  return {
    total: Number(data?.total ?? 0),
    inserted: Number(data?.inserted ?? 0),
    updated: Number(data?.updated ?? 0),
    skipped: Number(data?.skipped ?? 0),
    message: String(data?.message ?? ''),
  }
}

export async function fetchCity(id: string, signal?: AbortSignal): Promise<CityDetail> {
  const data = await http.request<unknown>(adminCityPath(id), { signal })
  const city = readCityDetail(data)
  if (!city) throw new Error('目的地不存在')
  return city
}

export async function saveCityChecklist(id: string, body: CityChecklistPatch): Promise<CityDetail> {
  const data = await http.request<unknown>(adminCityChecklistPath(id), { method: 'PATCH', body })
  const city = readCityDetail(data)
  if (!city) throw new Error('目的地不存在')
  return city
}

export async function openCity(id: string, version: number): Promise<CityDetail> {
  const data = await http.request<unknown>(adminCityOpenPath(id), {
    method: 'POST',
    body: buildCityVersionBody(version),
  })
  const city = readCityDetail(data)
  if (!city) throw new Error('目的地不存在')
  return city
}

export async function closeCity(id: string, version: number): Promise<CityDetail> {
  const data = await http.request<unknown>(adminCityClosePath(id), {
    method: 'POST',
    body: buildCityVersionBody(version),
  })
  const city = readCityDetail(data)
  if (!city) throw new Error('目的地不存在')
  return city
}

export async function fetchCityIntents(filter: CityIntentQuery, signal?: AbortSignal): Promise<CityIntentMetrics> {
  const data = await http.request<unknown>(ADMIN_API.cityIntents, {
    query: cityIntentQuery(filter),
    signal,
  })
  return readCityIntentMetrics(data)
}

export async function exportCityIntents(filter: CityIntentQuery): Promise<string> {
  return requestCsv(ADMIN_API.cityIntentExport, cityIntentQuery(filter))
}

export async function saveSiteConfig(draft: SiteConfigRecord): Promise<SiteConfigRecord> {
  const body = buildSiteConfigBody(draft)
  const data = await http.request<unknown>(ADMIN_API.siteConfig, { method: 'PUT', body })
  if (data === null || data === undefined) return body
  return readSiteConfig(data)
}
