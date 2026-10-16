import { ApiError } from '@nongjiale/shared'

export const ACCOUNT_DISABLED = '账号已停用'

export type AdminErrorKind =
  | 'disabled'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'generic'

export interface AdminErrorView {
  kind: AdminErrorKind
  message: string
}

export function describeAdminError(error: unknown): AdminErrorView {
  if (!(error instanceof ApiError)) {
    if (error instanceof Error && error.message.trim()) {
      return { kind: 'generic', message: error.message }
    }
    return { kind: 'generic', message: '网络异常，请稍后重试' }
  }
  if (error.httpStatus === 0) {
    return { kind: 'generic', message: '网络异常，请稍后重试' }
  }
  if (error.message.includes('停用')) {
    return { kind: 'disabled', message: ACCOUNT_DISABLED }
  }
  if (error.httpStatus === 401 || error.code === 401) {
    return { kind: 'unauthorized', message: error.message || '手机号或密码不正确' }
  }
  if (error.httpStatus === 403 || error.code === 403) {
    return { kind: 'forbidden', message: error.message || '无权访问' }
  }
  if (error.httpStatus === 404 || error.code === 404) {
    return { kind: 'notFound', message: error.message || '内容不存在或无权查看' }
  }
  if (error.httpStatus === 409 || error.code === 409) {
    return { kind: 'conflict', message: error.message || '操作冲突，请刷新后重试' }
  }
  if (error.httpStatus === 400 || error.code === 400) {
    return { kind: 'validation', message: error.message || '请检查填写内容' }
  }
  return { kind: 'generic', message: error.message || '请求失败，请重试' }
}
