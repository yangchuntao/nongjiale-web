import { TOKEN_KEYS, createHttpClient, type HttpClient } from '@nongjiale/shared'
import { apiBase } from '../env'
import { browserStorage } from '../utils/storage'

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler = () => {
  browserStorage()?.removeItem(TOKEN_KEYS.merchant)
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

export const http: HttpClient = createHttpClient({
  baseUrl: apiBase,
  getToken: () => browserStorage()?.getItem(TOKEN_KEYS.merchant) ?? null,
  onUnauthorized: () => {
    unauthorizedHandler()
  },
})
