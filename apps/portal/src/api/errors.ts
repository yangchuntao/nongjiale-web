import { ApiError } from '@nongjiale/shared'

export type PortalErrorKind = 'unauthorized' | 'conflict' | 'gone' | 'notFound' | 'validation' | 'generic'

export interface PortalErrorView {
  kind: PortalErrorKind
  message: string
}

export function describePortalError(error: unknown): PortalErrorView {
  if (!(error instanceof ApiError)) {
    return { kind: 'generic', message: '网络异常，请稍后重试' }
  }
  if (error.httpStatus === 401 || error.code === 401) {
    return { kind: 'unauthorized', message: '请先登录' }
  }
  if (error.httpStatus === 409 || error.code === 409) {
    return { kind: 'conflict', message: error.message || '该房源当前不可提交意向' }
  }
  if (error.httpStatus === 410 || error.code === 410) {
    return { kind: 'gone', message: error.message || '房源已下架或不可用' }
  }
  if (error.httpStatus === 404 || error.code === 404) {
    return { kind: 'notFound', message: error.message || '内容不存在或无权查看' }
  }
  if (error.httpStatus === 400 || error.code === 400) {
    return { kind: 'validation', message: error.message || '请检查填写内容' }
  }
  return { kind: 'generic', message: error.message || '请求失败，请重试' }
}
