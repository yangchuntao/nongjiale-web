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
  intentExportQuery,
  intentListQuery,
  presentIntentCsv,
  readAdminLogin,
  readAdminMe,
  readArticle,
  readBanner,
  readCityDetail,
  readCityIntentMetrics,
  readCityList,
  readIntent,
  readMerchantApply,
  readMerchantOrg,
  readPage,
  readPlainPassword,
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

export async function fetchCities(signal?: AbortSignal): Promise<CitySummary[]> {
  const data = await http.request<unknown>(ADMIN_API.cities, { signal })
  return readCityList(data)
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
