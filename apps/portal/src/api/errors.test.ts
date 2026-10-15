import { ApiError } from '@nongjiale/shared'
import { describe, expect, it } from 'vitest'
import { DATE_CONFLICT, LISTING_UNAVAILABLE, describePortalError } from './errors'

describe('describePortalError', () => {
  it('uses 410 for an off-shelf or unbookable listing', () => {
    expect(describePortalError(new ApiError('已下架或不可用', 410, 410))).toEqual({
      kind: 'gone',
      message: '已下架或不可用',
    })
    expect(describePortalError(new ApiError('', 410, 410))).toEqual({
      kind: 'gone',
      message: LISTING_UNAVAILABLE,
    })
    expect(describePortalError(new ApiError('房源已下架或不可用', 0, 410)).kind).toBe('gone')
  })

  it('keeps 409 for illegal dates and other conflicts', () => {
    expect(describePortalError(new ApiError('到店日期不能早于今天', 409, 409))).toEqual({
      kind: 'conflict',
      message: '到店日期不能早于今天',
    })
    expect(describePortalError(new ApiError('', 409, 409))).toEqual({
      kind: 'conflict',
      message: DATE_CONFLICT,
    })
  })

  it('maps auth and missing records', () => {
    expect(describePortalError(new ApiError('未登录', 401, 401)).kind).toBe('unauthorized')
    expect(describePortalError(new ApiError('不存在', 404, 404)).kind).toBe('notFound')
  })

  it('keeps a generic message for network failures', () => {
    expect(describePortalError(new Error('failed'))).toEqual({
      kind: 'generic',
      message: '网络异常，请稍后重试',
    })
  })
})
