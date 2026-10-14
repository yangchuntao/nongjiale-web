import type { ApiResponse } from '@nongjiale/shared'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export class ApiError extends Error {
  code: number
  httpStatus: number
  constructor(message: string, code: number, httpStatus: number) {
    super(message)
    this.code = code
    this.httpStatus = httpStatus
  }
}

type RequestOpts = {
  method?: string
  body?: unknown
  token?: string | null
  headers?: Record<string, string>
}

export async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers || {}),
  }
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  let json: ApiResponse<T> | null = null
  try {
    json = (await res.json()) as ApiResponse<T>
  } catch {
    throw new ApiError(res.statusText || '网络错误', res.status, res.status)
  }

  if (!res.ok || (json && json.code !== 0)) {
    throw new ApiError(json?.message || res.statusText || '请求失败', json?.code ?? res.status, res.status)
  }
  return json.data
}
