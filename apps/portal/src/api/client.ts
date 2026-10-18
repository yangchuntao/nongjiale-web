import { TOKEN_KEYS, createHttpClient, type HttpClient } from '@nongjiale/shared'
import { apiBase } from '../env'
import { browserStorage } from '../utils/storage'

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler = () => {
  browserStorage()?.removeItem(TOKEN_KEYS.portal)
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

export const http: HttpClient = createHttpClient({
  baseUrl: apiBase,
  getToken: () => browserStorage()?.getItem(TOKEN_KEYS.portal) ?? null,
  onUnauthorized: () => {
    unauthorizedHandler()
  },
})

/** 首页 Banner 公开且匿名。不附带门户令牌，失败时也不清 `nj_portal_token`。 */
export const publicHttp: HttpClient = createHttpClient({
  baseUrl: apiBase,
})
