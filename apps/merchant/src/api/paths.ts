/** 商家端只调用这些路径。不请求门户 `/api/auth` 或运营接口。不含 `/api/merchant/auth/me`。 */
export const MERCHANT_API = {
  login: '/api/merchant/auth/login',
  stores: '/api/merchant/stores',
  shelfApplications: '/api/merchant/shelf-applications',
  intents: '/api/merchant/intents',
} as const

export function merchantStorePath(id: string): string {
  return `/api/merchant/stores/${encodeURIComponent(id)}`
}

export function merchantShelfApplyPath(id: string): string {
  return `/api/merchant/stores/${encodeURIComponent(id)}/shelf-applications`
}

export function merchantIntentPath(id: string): string {
  return `/api/merchant/intents/${encodeURIComponent(id)}`
}
