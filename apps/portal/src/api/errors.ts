import { ApiError } from '@nongjiale/shared'

export type PortalErrorKind = 'unauthorized' | 'conflict' | 'gone' | 'notFound' | 'validation' | 'generic'

/** 详情与提交意向收到 410 时的对客文案。下架、不可订都用这一句。 */
export const LISTING_UNAVAILABLE = '房源已下架或不可用'

/** 409 只表示非法日期等冲突，默认句不描述下架。 */
export const DATE_CONFLICT = '日期不符合要求，请修改后再提交'

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
  if (error.httpStatus === 410 || error.code === 410) {
    return { kind: 'gone', message: error.message || LISTING_UNAVAILABLE }
  }
  if (error.httpStatus === 409 || error.code === 409) {
    return { kind: 'conflict', message: error.message || DATE_CONFLICT }
  }
  if (error.httpStatus === 404 || error.code === 404) {
    return { kind: 'notFound', message: error.message || '内容不存在或无权查看' }
  }
  if (error.httpStatus === 400 || error.code === 400) {
    return { kind: 'validation', message: error.message || '请检查填写内容' }
  }
  return { kind: 'generic', message: error.message || '请求失败，请重试' }
}
