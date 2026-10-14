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

export async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || json.code !== 0) {
    throw new ApiError(json.message || res.statusText, json.code ?? res.status, res.status)
  }
  return json.data
}
