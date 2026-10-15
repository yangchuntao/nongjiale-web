import { ApiError } from '@nongjiale/shared'
import { describe, expect, it } from 'vitest'
import { describePortalError } from './errors'

describe('describePortalError', () => {
  it('maps auth, booking conflict, and unavailable listing', () => {
    expect(describePortalError(new ApiError('未登录', 401, 401)).kind).toBe('unauthorized')
    expect(describePortalError(new ApiError('该房源当前不可提交意向', 409, 409)).message).toBe(
      '该房源当前不可提交意向',
    )
    expect(describePortalError(new ApiError('已下架或不可用', 410, 410)).kind).toBe('gone')
    expect(describePortalError(new ApiError('不存在', 404, 404)).kind).toBe('notFound')
  })

  it('keeps a generic message for network failures', () => {
    expect(describePortalError(new Error('failed'))).toEqual({
      kind: 'generic',
      message: '网络异常，请稍后重试',
    })
  })
})
