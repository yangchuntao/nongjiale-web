/** 运营端只调用这些路径。不请求门户登录或商家接口。 */
export const ADMIN_API = {
  login: '/api/admin/auth/login',
  me: '/api/admin/auth/me',
  merchantApplies: '/api/admin/merchant-applies',
  merchants: '/api/admin/merchants',
  stores: '/api/admin/stores',
  shelfApplications: '/api/admin/shelf-applications',
  intents: '/api/admin/intents',
  intentExport: '/api/admin/intents/export',
  articles: '/api/admin/articles',
  siteConfig: '/api/admin/site-config',
  cities: '/api/admin/cities',
  cityIntents: '/api/admin/metrics/city-intents',
  cityIntentExport: '/api/admin/metrics/city-intents/export',
} as const

export function adminApplyPath(id: string): string {
  return `/api/admin/merchant-applies/${encodeURIComponent(id)}`
}

export function adminApplyApprovePath(id: string): string {
  return `${adminApplyPath(id)}/approve`
}

export function adminApplyRejectPath(id: string): string {
  return `${adminApplyPath(id)}/reject`
}

export function adminMerchantPath(id: string): string {
  return `/api/admin/merchants/${encodeURIComponent(id)}`
}

export function adminResetPasswordPath(id: string): string {
  return `${adminMerchantPath(id)}/reset-password`
}

export function adminMerchantStoresPath(orgId: string): string {
  return `${adminMerchantPath(orgId)}/stores`
}

export function adminStorePath(id: string): string {
  return `/api/admin/stores/${encodeURIComponent(id)}`
}

export function adminShelfApprovePath(id: string): string {
  return `/api/admin/shelf-applications/${encodeURIComponent(id)}/approve`
}

export function adminShelfRejectPath(id: string): string {
  return `/api/admin/shelf-applications/${encodeURIComponent(id)}/reject`
}

export function adminIntentPath(id: string): string {
  return `/api/admin/intents/${encodeURIComponent(id)}`
}

export function adminIntentStatusPath(id: string): string {
  return `${adminIntentPath(id)}/status`
}

export function adminIntentNotesPath(id: string): string {
  return `${adminIntentPath(id)}/notes`
}

export function adminArticlePath(id: string): string {
  return `/api/admin/articles/${encodeURIComponent(id)}`
}

export function adminCityPath(id: string): string {
  return `/api/admin/cities/${encodeURIComponent(id)}`
}

export function adminCityChecklistPath(id: string): string {
  return `${adminCityPath(id)}/checklist`
}

export function adminCityOpenPath(id: string): string {
  return `${adminCityPath(id)}/open`
}

export function adminCityClosePath(id: string): string {
  return `${adminCityPath(id)}/close`
}
