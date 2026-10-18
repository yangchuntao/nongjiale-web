import { describe, expect, it } from 'vitest'
import { bannerFrame, classifyMiniBannerLink, visibleHomeBanners, type HomeBanner } from '../miniprogram/domain/banners'
import { INTENT_STATUS_LABEL, intentStatusLabel, intentSuccessCopy, normalizeIntentCopy } from '../miniprogram/domain/copy'
import { buildCreateIntentBody, validateIntent } from '../miniprogram/domain/intent'
import { findOpenCityBySlug, openCityRegions, type RegionItem } from '../miniprogram/domain/regions'
import {
  authFailureAction,
  buildPasswordBind,
  buildPhoneCodeBind,
  canLoadMyIntents,
  holdAfterBind,
  holdAfterLogin,
  holdAfterUnbind,
  intentPostBlock,
  isWebviewEnabled,
  resolveApiBase,
  selectToken,
} from '../miniprogram/domain/session'
import { listEmptyCopy, shareImageUrl, storeListQuery, storeSharePath } from '../miniprogram/domain/stores'
import { readHomeBanners, readStoreList, readWechatSession } from '../miniprogram/api/readers'

const banner = (patch: Partial<HomeBanner>): HomeBanner => ({
  id: '1',
  title: '活动',
  imageUrl: 'https://cdn.example.com/a.jpg',
  linkUrl: '/',
  scope: 'ALL',
  cityId: null,
  citySlug: null,
  cityName: null,
  sortOrder: 1,
  enabled: true,
  ...patch,
})

const city = (patch: Partial<RegionItem>): RegionItem => ({
  id: 1,
  name: '扬州',
  slug: 'yangzhou',
  parentId: 9,
  level: 'CITY',
  openStatus: 'OPEN',
  ...patch,
})

describe('banner links and order', () => {
  it('hides an empty set, keeps one still frame, and carousels from two', () => {
    expect(bannerFrame(0)).toBe('hidden')
    expect(bannerFrame(1)).toBe('still')
    expect(bannerFrame(2)).toBe('carousel')
  })

  it('sorts by sortOrder then id and drops disabled rows', () => {
    const visible = visibleHomeBanners([
      banner({ id: '3', sortOrder: 2 }),
      banner({ id: '2', sortOrder: 1, enabled: false }),
      banner({ id: '10', sortOrder: 1 }),
    ])
    expect(visible.map((item) => item.id)).toEqual(['10', '3'])
  })

  it('routes the locked linkUrl shapes', () => {
    expect(classifyMiniBannerLink('/')).toEqual({ kind: 'home' })
    expect(classifyMiniBannerLink('/?city=yangzhou')).toEqual({ kind: 'list', slug: 'yangzhou' })
    expect(classifyMiniBannerLink('https://example.com/a')).toEqual({ kind: 'external', href: 'https://example.com/a' })
    expect(classifyMiniBannerLink('http://example.com/a')).toEqual({ kind: 'external', href: 'http://example.com/a' })
    expect(classifyMiniBannerLink('/stores/1')).toEqual({ kind: 'toast' })
    expect(classifyMiniBannerLink('javascript:alert(1)')).toEqual({ kind: 'ignore' })
    expect(classifyMiniBannerLink('data:text/html,hi')).toEqual({ kind: 'ignore' })
    expect(classifyMiniBannerLink('//evil.example')).toEqual({ kind: 'ignore' })
    expect(classifyMiniBannerLink('')).toEqual({ kind: 'ignore' })
  })
})

describe('open cities', () => {
  const regions = [
    city({ id: 1, name: '扬州', slug: 'yangzhou', openStatus: 'OPEN' }),
    city({ id: 3, name: '南通', slug: 'nantong', openStatus: 'CLOSED' }),
    city({ id: 4, name: '广陵', slug: 'guangling', level: 'DISTRICT', parentId: 1, openStatus: 'OPEN' }),
  ]

  it('keeps CLOSED cities out of the chips', () => {
    expect(openCityRegions(regions).map((item) => item.slug)).toEqual(['yangzhou'])
    expect(findOpenCityBySlug(regions, 'nantong')).toBeNull()
    expect(findOpenCityBySlug(regions, 'yangzhou')?.id).toBe(1)
  })
})

describe('store query and share', () => {
  it('omits an empty keyword and rejects more than 64 characters', () => {
    const open = storeListQuery({ keyword: '  ', page: 1, regionId: 2 })
    expect(open.ok && open.query).toEqual({ page: 1, pageSize: 20, regionId: 2 })
    const blank = storeListQuery({ keyword: '', page: 1 })
    expect(blank.ok && 'keyword' in blank.query).toBe(false)
    expect(storeListQuery({ keyword: '店'.repeat(65), page: 1 }).ok).toBe(false)
  })

  it('shares the detail path and only https covers', () => {
    expect(storeSharePath(8)).toBe('/pages/detail/index?id=8')
    expect(shareImageUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
    expect(shareImageUrl('http://cdn.example.com/a.jpg')).toBe('')
    expect(listEmptyCopy('')).toBe('该市暂无上架农家乐')
    expect(listEmptyCopy('河畔')).toBe('未找到相关门店')
  })
})

describe('intent validation', () => {
  const draft = {
    checkIn: '2026-10-20',
    checkOut: '2026-10-22',
    nights: '2',
    guests: '2',
    contactName: '张三',
    contactPhone: '13800138000',
    userRemark: '',
  }

  it('builds the portal body without an amount', () => {
    const result = buildCreateIntentBody(8, draft, '2026-10-15')
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

  it('rejects a checkout before check-in and a short phone', () => {
    const errors = validateIntent({ ...draft, checkOut: '2026-10-19', nights: '', contactPhone: '123' }, '2026-10-15')
    expect(errors.checkOut).toBe('离店日期须晚于到店日期')
    expect(errors.contactPhone).toBe('请输入 11 位手机号')
  })
})

describe('session locks', () => {
  it('does not persist a token unless the account is linked', () => {
    expect(holdAfterLogin(false, 'abc', null)).toEqual({
      stored: null,
      memory: 'abc',
      writeStored: false,
      deleteStored: false,
    })
    expect(holdAfterLogin(true, 'abc', null).writeStored).toBe(true)
    expect(holdAfterBind(true, 'next').stored).toBe('next')
    expect(holdAfterBind(false, 'next')).toMatchObject({ writeStored: false, deleteStored: true, memory: 'next' })
    expect(holdAfterUnbind().deleteStored).toBe(true)
  })

  it('keeps memory tokens off tourist requests and my-intents', () => {
    expect(selectToken('public', 'stored', 'memory')).toBeNull()
    expect(selectToken('tourist', null, 'memory')).toBeNull()
    expect(selectToken('tourist', 'stored', 'memory')).toEqual({ token: 'stored', stored: true })
    expect(selectToken('wechat', null, 'memory')).toEqual({ token: 'memory', stored: false })
    expect(canLoadMyIntents(null, false)).toBe(false)
    expect(canLoadMyIntents('stored', false)).toBe(false)
    expect(canLoadMyIntents('stored', true)).toBe(true)
    expect(intentPostBlock(false, null)).toContain('请先绑定手机号')
    expect(intentPostBlock(true, '13800138000')).toBeNull()
  })

  it('does not clear a linked token on public or password failures', () => {
    expect(
      authFailureAction({ mode: 'public', httpStatus: 401, code: 401, message: '未登录', usedStoredToken: true }),
    ).toBe('none')
    expect(
      authFailureAction({
        mode: 'wechat',
        httpStatus: 401,
        code: 401,
        message: '手机号或密码错误',
        usedStoredToken: true,
      }),
    ).toBe('none')
    expect(
      authFailureAction({ mode: 'tourist', httpStatus: 401, code: 401, message: '未登录', usedStoredToken: true }),
    ).toBe('clear-stored')
    expect(
      authFailureAction({
        mode: 'wechat',
        httpStatus: 401,
        code: 0,
        message: '微信登录已失效，请重试',
        usedStoredToken: false,
      }),
    ).toBe('none')
  })

  it('builds mutually exclusive bind bodies', () => {
    expect(buildPhoneCodeBind('phone-code', '')).toEqual({ ok: true, body: { phoneCode: 'phone-code' } })
    expect(buildPhoneCodeBind('phone-code', 'secret1').ok && buildPhoneCodeBind('phone-code', 'secret1')).toEqual({
      ok: true,
      body: { phoneCode: 'phone-code', password: 'secret1' },
    })
    const manual = buildPasswordBind('13800138000', 'secret1')
    expect(manual.ok && manual.body).toEqual({ phone: '13800138000', password: 'secret1' })
    expect(JSON.stringify(manual).includes('phoneCode')).toBe(false)
  })

  it('keeps localhost unless a local https override is set, and web-view stays off', () => {
    expect(resolveApiBase('', 'http://localhost:8080')).toBe('http://localhost:8080')
    expect(resolveApiBase('https://api.example.com/', 'http://localhost:8080')).toBe('https://api.example.com')
    expect(resolveApiBase('javascript:alert(1)', 'http://localhost:8080')).toBe('http://localhost:8080')
    expect(isWebviewEnabled(undefined)).toBe(false)
    expect(isWebviewEnabled('1')).toBe(true)
  })
})

describe('checked-in copy', () => {
  it('shows 已入住 and rewrites forbidden labels', () => {
    expect(INTENT_STATUS_LABEL.CHECKED_IN).toBe('已入住')
    expect(intentStatusLabel('CHECKED_IN', '已定着')).toBe('已入住')
    expect(intentStatusLabel('CHECKED_IN')).toBe('已入住')
    expect(normalizeIntentCopy('已落实')).toBe('已入住')
    const success = intentSuccessCopy('NJ100', '400-000-0000')
    expect(success).toContain('意向单号：NJ100')
    expect(success).toContain('意向不等于已锁房')
    expect(success).not.toContain('已定着')
    expect(success).not.toContain('已订立')
  })
})

describe('readers', () => {
  it('drops closed-city stores and only accepts an array of banners', () => {
    const closed = readStoreList({
      items: [{ id: 1, name: '不该出现' }],
      total: 1,
      page: 1,
      pageSize: 20,
      destinationStatus: 'CLOSED',
      emptyHint: '',
    })
    expect(closed.items).toEqual([])
    expect(closed.emptyHint).toBe('该目的地暂未开通')
    expect(readHomeBanners({ items: [] })).toEqual([])
  })

  it('treats accountLinked as true only for a real boolean', () => {
    expect(readWechatSession({ token: 'abc', accountLinked: 'true', phone: null })?.accountLinked).toBe(false)
    expect(readWechatSession({ token: 'abc', accountLinked: true, phone: '13800138000' })?.accountLinked).toBe(true)
  })
})
