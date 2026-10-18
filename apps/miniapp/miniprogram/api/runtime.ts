import { createClient, type RequestOptions } from './http'
import {
  clearStoredToken,
  dropMemoryToken,
  openLogin,
  readApiBase,
  readMemoryToken,
  readStoredToken,
} from './session'
import { wxRequest } from './transport'
import { selectToken } from '../domain/session'

function client(mode: 'public' | 'tourist' | 'wechat') {
  return createClient({
    baseUrl: readApiBase(),
    mode,
    request: wxRequest,
    getToken: () => selectToken(mode, readStoredToken(), readMemoryToken()),
    onUnauthorized: (info) => {
      if (info.action === 'clear-stored') clearStoredToken()
      if (info.action === 'drop-memory') dropMemoryToken()
      openLogin()
    },
  })
}

export function publicRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  return client('public').request<T>(path, options)
}

export function touristRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  return client('tourist').request<T>(path, options)
}

export function wechatRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  return client('wechat').request<T>(path, options)
}
