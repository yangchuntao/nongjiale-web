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
  opts: { method?: string; body?: unknown; token?: string | null; headers?: Record<string, string> } = {},
): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers || {}),
  }
  if (opts.body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: isForm ? (opts.body as FormData) : opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    throw new ApiError('无法连接服务器，请确认后端已在 localhost:8080 启动', 0, 0)
  }

  let json: ApiResponse<T> | null = null
  try {
    json = (await res.json()) as ApiResponse<T>
  } catch {
    throw new ApiError(res.status === 404 ? '接口尚未实现或资源不存在' : (res.statusText || '网络错误'), res.status, res.status)
  }
  if (!json || !res.ok || json.code !== 0) {
    throw new ApiError(
      json?.message || (res.status === 404 ? '接口尚未实现或资源不存在' : res.statusText || '请求失败'),
      json?.code ?? res.status,
      res.status,
    )
  }
  return json.data
}
