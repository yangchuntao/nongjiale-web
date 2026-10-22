import { describe, expect, it } from 'vitest'
import { intentSuccessCopy } from './copy'
import { buildCreateIntentBody, validateIntent } from './intent'
import { buildMerchantApplyBody } from './apply'

const draft = {
  checkIn: '2026-10-20',
  checkOut: '2026-10-22',
  nights: '2',
  guests: '2',
  contactName: '张三',
  contactPhone: '13800138000',
  userRemark: '',
}

describe('validateIntent', () => {
  it('accepts check-in with matching nights', () => {
    const result = buildCreateIntentBody(8, draft, '2026-10-15')
    expect(result.errors).toEqual({})
    expect(result.body).toEqual({
      storeId: 8,
      checkIn: '2026-10-20',
      checkOut: '2026-10-22',
      nights: 2,
      guests: 2,
      contactName: '张三',
      contactPhone: '13800138000',
    })
    expect(result.body && 'amount' in result.body).toBe(false)
  })

  it('rejects checkout before check-in and a bad phone', () => {
    const errors = validateIntent(
      { ...draft, checkOut: '2026-10-19', nights: '', contactPhone: '123' },
      '2026-10-15',
    )
    expect(errors.checkOut).toBe('离店日期须晚于到店日期')
    expect(errors.contactPhone).toBe('请输入 11 位手机号')
  })

  it('rejects a check-in before today', () => {
    expect(validateIntent({ ...draft, checkIn: '2026-10-01' }, '2026-10-15').checkIn).toBe(
      '到店日期不能早于今天',
    )
  })
})

describe('intent copy', () => {
  it('states the intent number and that nothing is locked or paid', () => {
    const text = intentSuccessCopy('NJ100', '400-000-0000')
    expect(text).toContain('意向单号：NJ100')
    expect(text).toContain('意向不等于已锁房')
    expect(text.includes('已订立')).toBe(false)
    expect(text.includes('已落实')).toBe(false)
    expect(text.includes('已落地')).toBe(false)
    expect(text.includes('已成交')).toBe(false)
    expect(text.includes('已达成')).toBe(false)
  })
})

describe('merchant apply', () => {
  it('requires the public fields and omits an empty remark', () => {
    const result = buildMerchantApplyBody({
      subjectName: '苏中农庄',
      contactName: '李四',
      contactPhone: '13900139000',
      storeName: '河畔小院',
      regionId: '3',
      remark: '  ',
    })
    expect(result.body).toEqual({
      orgName: '苏中农庄',
      contactName: '李四',
      contactPhone: '13900139000',
      plannedStoreName: '河畔小院',
      regionId: 3,
    })
  })
})
