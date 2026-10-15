import type { ApiResponse } from './types'

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

export type RequestQuery = Record<string, string | number | boolean | null | undefined>

export interface RequestOptions {
  method?: string
  body?: unknown
  query?: RequestQuery
  signal?: AbortSignal
  headers?: HeadersInit
}

export interface HttpClientOptions {
  baseUrl?: string
  getToken?: () => string | null | undefined
  onUnauthorized?: () => void
}

export interface HttpClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>
}

export const DEFAULT_API_BASE = 'http://localhost:8080'

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.code === 'number' && typeof record.message === 'string' && 'data' in record
}

function buildUrl(baseUrl: string, path: string, query: RequestQuery | undefined): string {
  const base = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${base}${normalizedPath}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const baseUrl = options.baseUrl?.trim() || DEFAULT_API_BASE

  async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
    const headers = new Headers(requestOptions.headers)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')

    const token = options.getToken?.()?.trim()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const method = requestOptions.method ?? (requestOptions.body === undefined ? 'GET' : 'POST')
    let body: string | undefined
    if (requestOptions.body !== undefined) {
      body = JSON.stringify(requestOptions.body)
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    }

    let response: Response
    try {
      response = await fetch(buildUrl(baseUrl, path, requestOptions.query), {
        method,
        headers,
        body,
        signal: requestOptions.signal,
        credentials: 'omit',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '网络异常'
      throw new ApiError(message, -1, 0)
    }

    const text = await response.text()
    let payload: unknown = null
    if (text) {
      try {
        payload = JSON.parse(text) as unknown
      } catch {
        if (response.status === 401) options.onUnauthorized?.()
        throw new ApiError(response.statusText || '响应不是合法 JSON', response.status, response.status)
      }
    }

    if (response.status === 401) options.onUnauthorized?.()

    if (!isApiResponse(payload)) {
      const message = response.status === 401 ? '未登录' : response.statusText || '响应缺少 code、message、data'
      throw new ApiError(message, response.status, response.status)
    }

    if (payload.code === 401 && response.status !== 401) options.onUnauthorized?.()

    if (payload.code !== 0 || !response.ok) {
      throw new ApiError(payload.message || '请求失败', payload.code, response.status)
    }

    return payload.data as T
  }

  return { request }
}
