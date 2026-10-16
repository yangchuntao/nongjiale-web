import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@nongjiale/shared'
import { ACCOUNT_DISABLED, describeMerchantError } from './errors'
import { MERCHANT_API, merchantIntentPath, merchantShelfApplyPath, merchantStorePath } from './paths'
import {
  STORE_UPDATE_FORBIDDEN,
  STORE_UPDATE_KEYS,
  buildShelfBody,
  buildStoreUpdateBody,
  displayContactPhone,
  draftFromDetail,
  intentStatusLabel,
  intentTagMuted,
  intentTagType,
  readIntent,
  readMerchantLogin,
  readMerchantPage,
  readShelfApplication,
  readStore,
  validateShelfReason,
  type StoreDraft,
} from './readers'

const draft: StoreDraft = {
  name: ' 河畔农家 ',
  regionId: 12,
  address: '某路 1 号',
  phone: '0523-0000000',
  coverUrl: 'https://img.example/cover.jpg',
  galleryText: 'https://img.example/a.jpg\n\nhttps://img.example/b.jpg',
  packageText: '双人套餐',
  facilities: '停车',
  features: '钓鱼',
  notice: '需预约',
  trafficText: '自驾',
  priceText: '人均 200',
  priceFromText: '200',
  version: 3,
}

describe('merchant store update body', () => {
  it('sends profile fields and version, and omits recommendation and shelf status', () => {
    const body = buildStoreUpdateBody({
      ...draft,
      homeRecommended: true,
      homeSort: 1,
      shelfStatus: 'ON_SHELF',
      regionName: '兴化',
      packages: [],
      testTag: '测试',
    } as StoreDraft)
    expect(body).toEqual({
      name: '河畔农家',
      regionId: 12,
      address: '某路 1 号',
      phone: '0523-0000000',
      coverUrl: 'https://img.example/cover.jpg',
      gallery: ['https://img.example/a.jpg', 'https://img.example/b.jpg'],
      priceText: '人均 200',
      priceFrom: 200,
      packageText: '双人套餐',
      facilities: '停车',
      features: '钓鱼',
      notice: '需预约',
      trafficText: '自驾',
      version: 3,
    })
    expect(Object.keys(body).sort()).toEqual([...STORE_UPDATE_KEYS].sort())
    for (const key of STORE_UPDATE_FORBIDDEN) {
      expect(Object.hasOwn(body, key)).toBe(false)
    }
    expect(JSON.stringify(body)).not.toContain('regionName')
    expect(JSON.stringify(body)).not.toContain('packages')
    expect(JSON.stringify(body)).not.toContain('testTag')
  })

  it('refuses to save when version is missing', () => {
    expect(() => buildStoreUpdateBody({ ...draft, version: null })).toThrow('缺少版本号')
  })
})

describe('merchant readers', () => {
  it('reads the BE-5 store and ignores packages, regionName, and testTag', () => {
    const store = readStore({
      id: 8,
      merchantOrgId: 4,
      name: '河畔',
      regionId: 12,
      coverUrl: 'https://img.example/c.jpg',
      gallery: ['https://img.example/a.jpg'],
      priceText: '200 起',
      priceFrom: 200,
      shelfStatus: 'OFF_SHELF',
      homeRecommended: true,
      homeSort: 2,
      version: 5,
      regionName: '不应读取',
      packages: [{ name: '套餐' }],
      testTag: '测试',
    })
    expect(store).toMatchObject({
      id: '8',
      merchantOrgId: '4',
      name: '河畔',
      regionId: 12,
      shelfStatus: 'OFF_SHELF',
      homeRecommended: true,
      homeSort: 2,
      version: 5,
      gallery: ['https://img.example/a.jpg'],
    })
    expect(store && 'regionName' in store).toBe(false)
    expect(store && 'packages' in store).toBe(false)
    expect(store && 'testTag' in store).toBe(false)
  })

  it('keeps recommendation fields on the detail object but out of the submit body', () => {
    const detail = readStore({
      id: 's-1',
      name: '河畔',
      regionId: 3,
      packageText: '套餐',
      version: 4,
      homeRecommended: false,
      homeSort: 9,
      shelfStatus: 'ON_SHELF',
      gallery: ['https://img.example/a.jpg'],
      priceFrom: null,
    })
    expect(detail?.homeRecommended).toBe(false)
    const body = buildStoreUpdateBody(draftFromDetail(detail!))
    expect(body.version).toBe(4)
    expect(body.regionId).toBe(3)
    expect(body.priceFrom).toBeNull()
    expect(Object.hasOwn(body, 'homeRecommended')).toBe(false)
    expect(Object.hasOwn(body, 'homeSort')).toBe(false)
    expect(Object.hasOwn(body, 'shelfStatus')).toBe(false)
  })

  it('requires a page object with items', () => {
    expect(readMerchantPage({ items: [], total: 0, page: 1, pageSize: 20 }, readStore).items).toEqual([])
    expect(() => readMerchantPage({ total: 0 }, readStore)).toThrow('列表响应缺少 items')
    expect(() => readMerchantPage([], readStore)).toThrow('列表响应缺少 items')
  })

  it('reads shelf applications with storeName and review status', () => {
    const row = readShelfApplication({
      id: 7,
      storeId: 8,
      storeName: '河畔',
      merchantOrgId: 4,
      action: 'PUBLISH',
      reason: '资料已齐',
      status: 'PENDING',
      rejectReason: '',
      createdAt: '2026-10-15T08:00:00',
      type: '不应作为动作',
    })
    expect(row).toMatchObject({
      id: '7',
      storeId: '8',
      storeName: '河畔',
      merchantOrgId: '4',
      action: 'PUBLISH',
      status: 'PENDING',
      createdAt: '2026-10-15 08:00',
    })
    expect(row?.createdAt).not.toContain('T')
  })

  it('reads a masked phone as-is and masks a plain mobile', () => {
    expect(displayContactPhone('138****5678')).toBe('138****5678')
    expect(displayContactPhone('13812345678')).toBe('138****5678')
    expect(displayContactPhone('')).toBe('')
  })

  it('labels CHECKED_IN as 已入住', () => {
    const intent = readIntent({
      id: 3,
      intentNo: 'I-3',
      status: 'CHECKED_IN',
      contactName: '张三',
      contactPhone: '138****5678',
      guests: 2,
    })
    expect(intent?.contactName).toBe('张三')
    expect(intentStatusLabel(intent?.status ?? '')).toBe('已入住')
    expect(intentStatusLabel('CHECKED_IN')).toBe('已入住')
    expect(intentTagType('CONFIRMED')).toBe('info')
    expect(intentTagType('CHECKED_IN')).toBe('success')
    expect(intentTagMuted('CLOSED')).toBe(true)
    expect(intentTagMuted('CONFIRMED')).toBe(false)
    expect(intentStatusLabel('CHECKED_IN')).not.toContain('已订立')
    expect(intentStatusLabel('CHECKED_IN')).not.toContain('已成交')
  })

  it('reads the merchant login payload and rejects other roles', () => {
    expect(
      readMerchantLogin({
        token: 'abc',
        expiresAt: '2026-10-16T00:00:00Z',
        merchantUserId: 9,
        merchantOrgId: 4,
        role: 'MERCHANT',
        displayName: '河畔',
      }),
    ).toMatchObject({ token: 'abc', role: 'MERCHANT', merchantOrgId: '4', displayName: '河畔' })
    expect(() => readMerchantLogin({ token: 'abc', role: 'ADMIN' })).toThrow('不是商家账号')
    expect(() => readMerchantLogin({ role: 'MERCHANT' })).toThrow('缺少令牌')
  })
})

describe('shelf application body', () => {
  it('posts action and a trimmed reason', () => {
    expect(buildShelfBody('UNPUBLISH', ' 淡季休息 ')).toEqual({ action: 'UNPUBLISH', reason: '淡季休息' })
    expect(validateShelfReason('  ')).toBe('请填写申请原因')
  })
})

describe('merchant errors', () => {
  it('normalizes either disabled-account message', () => {
    expect(describeMerchantError(new ApiError('商家已停用', 403, 403))).toEqual({
      kind: 'disabled',
      message: ACCOUNT_DISABLED,
    })
    expect(describeMerchantError(new ApiError('账号已停用', 403, 403))).toEqual({
      kind: 'disabled',
      message: ACCOUNT_DISABLED,
    })
  })

  it('does not treat every 403 as a disabled account', () => {
    const view = describeMerchantError(new ApiError('无权查看该门店', 403, 403))
    expect(view.kind).toBe('forbidden')
    expect(view.message).toBe('无权查看该门店')
  })

  it('surfaces a pending shelf conflict', () => {
    const view = describeMerchantError(new ApiError('已有待审申请', 409, 409))
    expect(view.kind).toBe('conflict')
    expect(view.message).toBe('已有待审申请')
  })
})

describe('merchant api paths', () => {
  it('stays on the merchant api and does not call auth me', () => {
    const paths = [
      MERCHANT_API.login,
      MERCHANT_API.stores,
      MERCHANT_API.shelfApplications,
      MERCHANT_API.intents,
      merchantStorePath('a/b'),
      merchantShelfApplyPath('9'),
      merchantIntentPath('9'),
    ]
    expect(paths).toContain('/api/merchant/auth/login')
    expect(merchantStorePath('9')).toBe('/api/merchant/stores/9')
    expect(merchantShelfApplyPath('9')).toBe('/api/merchant/stores/9/shelf-applications')
    for (const path of paths) {
      expect(path.startsWith('/api/merchant/')).toBe(true)
      expect(path).not.toContain('/auth/me')
    }
    const client = readFileSync(new URL('./merchant.ts', import.meta.url), 'utf8')
    expect(client).not.toContain('/api/merchant/auth/me')
    expect(client).not.toContain('/api/auth/login')
  })
})

describe('merchant page constraints', () => {
  it('has no create-store entry and does not edit recommendation fields', () => {
    const list = readFileSync(new URL('../views/StoreListView.vue', import.meta.url), 'utf8')
    const edit = readFileSync(new URL('../views/StoreEditView.vue', import.meta.url), 'utf8')
    const shelf = readFileSync(new URL('../views/ShelfView.vue', import.meta.url), 'utf8')
    const intents = readFileSync(new URL('../views/IntentListView.vue', import.meta.url), 'utf8')
    const detail = readFileSync(new URL('../views/IntentDetailView.vue', import.meta.url), 'utf8')
    const copy = readFileSync(new URL('../domain/copy.ts', import.meta.url), 'utf8')
    expect(list).not.toContain('新建门店')
    expect(edit).not.toContain('新建门店')
    expect(edit).not.toMatch(/v-model="[^"]*homeRecommended/)
    expect(edit).not.toMatch(/v-model="[^"]*homeSort/)
    expect(edit).not.toMatch(/v-model="[^"]*shelfStatus/)
    expect(shelf).toContain('PUBLISH')
    expect(shelf).toContain('UNPUBLISH')
    expect(intents).toContain('MERCHANT_INTENT_NOTICE')
    expect(detail).toContain('MERCHANT_INTENT_NOTICE')
    expect(copy).toContain('意向由平台客服跟进。意向不等于已锁房。')
    expect(detail).not.toContain('追加备注')
    expect(detail).not.toContain('查看完整')
    expect(detail).not.toMatch(/method:\s*['"]PUT['"]/)
    expect(detail).not.toMatch(/method:\s*['"]POST['"]/)
  })
})
