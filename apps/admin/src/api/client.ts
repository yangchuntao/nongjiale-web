import { ApiError, TOKEN_KEYS, createHttpClient, type HttpClient, type RequestQuery } from '@nongjiale/shared'
import { apiBase } from '../env'
import { browserStorage } from '../utils/storage'

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler = () => {
  browserStorage()?.removeItem(TOKEN_KEYS.admin)
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

export const http: HttpClient = createHttpClient({
  baseUrl: apiBase,
  getToken: () => browserStorage()?.getItem(TOKEN_KEYS.admin) ?? null,
  onUnauthorized: () => {
    unauthorizedHandler()
  },
})

function adminUrl(path: string, query: RequestQuery | undefined): string {
  const base = apiBase.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${base}${normalizedPath}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

/** 意向导出是原始 CSV，不走 `{code,message,data}`。 */
export async function requestCsv(path: string, query?: RequestQuery): Promise<string> {
  const headers = new Headers()
  headers.set('Accept', 'text/csv, text/plain, */*')
  const token = browserStorage()?.getItem(TOKEN_KEYS.admin)?.trim()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(adminUrl(path, query), { method: 'GET', headers, credentials: 'omit' })
  } catch (error) {
    const message = error instanceof Error ? error.message : '网络异常'
    throw new ApiError(message, -1, 0)
  }

  const text = await response.text()
  if (response.status === 401) {
    unauthorizedHandler()
    throw new ApiError('未登录', 401, 401)
  }
  const trimmed = text.trim()
  if (!response.ok || trimmed.startsWith('{')) {
    throw new ApiError(trimmed.startsWith('{') ? '导出响应不是原始 CSV' : response.statusText || '导出失败', response.status, response.status)
  }
  return text
}
