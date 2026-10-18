import type { AuthFailureAction, HttpMode } from '../domain/session'
import { authFailureAction } from '../domain/session'

export class ApiError extends Error {
  readonly code: number
  readonly httpStatus: number

  constructor(message: string, code: number, httpStatus: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

export interface MiniResponse {
  statusCode: number
  data: unknown
}

export interface MiniRequest {
  url: string
  method: string
  data?: string
  header: Record<string, string>
}

export type MiniRequester = (options: MiniRequest) => Promise<MiniResponse>

export interface RequestOptions {
  method?: string
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
}

export interface TokenChoice {
  token: string
  stored: boolean
}

export interface UnauthorizedInfo {
  action: Exclude<AuthFailureAction, 'none'>
  message: string
}

export interface ClientOptions {
  baseUrl: string
  mode: HttpMode
  request: MiniRequester
  getToken?: () => TokenChoice | null
  onUnauthorized?: (info: UnauthorizedInfo) => void
}

export interface Client {
  request<T>(path: string, options?: RequestOptions): Promise<T>
}

interface ApiEnvelope {
  code: number
  message: string
  data: unknown
}

function isEnvelope(value: unknown): value is ApiEnvelope {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.code === 'number' && typeof record.message === 'string' && 'data' in record
}

export function buildUrl(
  baseUrl: string,
  path: string,
  query: RequestOptions['query'],
): string {
  const base = baseUrl.replace(/\/+$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  const params: string[] = []
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    }
  }
  return params.length ? `${base}${normalized}?${params.join('&')}` : `${base}${normalized}`
}

function readPayload(data: unknown): unknown {
  if (typeof data === 'string') {
    if (!data) return null
    return JSON.parse(data) as unknown
  }
  return data
}

export function createClient(options: ClientOptions): Client {
  const baseUrl = options.baseUrl.trim() || 'http://localhost:8080'

  async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
    const choice = options.mode === 'public' ? null : options.getToken?.() ?? null
    const header: Record<string, string> = { Accept: 'application/json' }
    if (choice?.token) header.Authorization = `Bearer ${choice.token}`

    const method = requestOptions.method ?? (requestOptions.body === undefined ? 'GET' : 'POST')
    let data: string | undefined
    if (requestOptions.body !== undefined) {
      data = JSON.stringify(requestOptions.body)
      header['Content-Type'] = 'application/json'
    }

    let response: MiniResponse
    try {
      response = await options.request({
        url: buildUrl(baseUrl, path, requestOptions.query),
        method,
        header,
        ...(data === undefined ? {} : { data }),
      })
    } catch (error) {
      if (error instanceof ApiError) throw error
      const message = error instanceof Error ? error.message : '网络异常'
      throw new ApiError(message, -1, 0)
    }

    let payload: unknown = null
    try {
      payload = readPayload(response.data)
    } catch {
      if (response.statusCode === 401) {
        notify(options, response.statusCode, 401, '未登录', Boolean(choice?.stored))
      }
      throw new ApiError(response.statusCode === 401 ? '未登录' : '响应不是合法 JSON', response.statusCode, response.statusCode)
    }

    const status = response.statusCode
    if (!isEnvelope(payload)) {
      const message = status === 401 ? '未登录' : '响应缺少 code、message、data'
      notify(options, status, status, message, Boolean(choice?.stored))
      throw new ApiError(message, status, status)
    }

    notify(options, status, payload.code, payload.message, Boolean(choice?.stored))

    if (payload.code !== 0 || status < 200 || status >= 300) {
      throw new ApiError(payload.message || '请求失败', payload.code, status)
    }
    return payload.data as T
  }

  return { request }
}

function notify(
  options: ClientOptions,
  httpStatus: number,
  code: number,
  message: string,
  usedStoredToken: boolean,
): void {
  const action = authFailureAction({
    mode: options.mode,
    httpStatus,
    code,
    message,
    usedStoredToken,
  })
  if (action === 'none') return
  options.onUnauthorized?.({ action, message })
}
