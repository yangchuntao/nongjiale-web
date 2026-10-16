import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FORBIDDEN_INTENT_LABELS, INTENT_STATUS_LABEL, TOKEN_KEYS } from '@nongjiale/shared'
import { ApiError } from '@nongjiale/shared'
import { ACCOUNT_DISABLED, describeAdminError } from './errors'
import {
  ADMIN_API,
  adminApplyApprovePath,
  adminApplyRejectPath,
  adminArticlePath,
  adminIntentNotesPath,
  adminIntentStatusPath,
  adminMerchantStoresPath,
  adminResetPasswordPath,
} from './paths'
import {
  ADMIN_PROFILE_KEY,
  INTENT_CSV_HEADERS,
  STORE_UPDATE_FORBIDDEN,
  STORE_UPDATE_KEYS,
  buildArticleBody,
  buildIntentNoteBody,
  buildIntentStatusBody,
  buildListingBody,
  buildLoginBody,
  buildMerchantStatusBody,
  buildOptionalPassword,
  buildRejectBody,
  buildSiteConfigBody,
  displayIntentStatus,
  intentTagMuted,
  intentTagType,
  intentExportQuery,
  intentListQuery,
  intentStatusLabel,
  intentsToCsv,
  nextIntentStatuses,
  pageQuery,
  presentIntentCsv,
  readAdminLogin,
  readAdminMe,
  readArticle,
  readMerchantApply,
  readMerchantOrg,
  readPage,
  readPlainPassword,
  readSiteConfig,
  readStore,
  type ListingDraft,
} from './readers'

const listingDraft: ListingDraft = {
  name: ' 河畔农家 ',
  regionId: 12,
  address: '某路 1 号',
  phone: '0523-0000000',
  coverUrl: 'https://img.example/cover.jpg',
  galleryText: 'https://img.example/a.jpg\nhttps://img.example/b.jpg',
  priceText: '人均 200',
  priceFromText: '',
  packageText: '双人套餐',
  facilities: '停车',
  features: '钓鱼',
  notice: '需预约',
  trafficText: '自驾',
  homeRecommended: true,
  homeSortText: '1',
  shelfStatus: 'OFF_SHELF',
  version: 4,
}

describe('admin auth contract', () => {
  it('stores the operator token separately and logs in with phone plus password', () => {
    expect(TOKEN_KEYS.admin).toBe('nj_admin_token')
    expect(ADMIN_PROFILE_KEY).toBe('nj_admin_profile')
    expect(ADMIN_PROFILE_KEY).not.toBe(TOKEN_KEYS.admin)
    const body = buildLoginBody(' 13800138000 ', 'secret')
    expect(body).toEqual({ phone: '13800138000', password: 'secret' })
    expect(Object.keys(body)).toEqual(['phone', 'password'])
    expect(ADMIN_API.login).toBe('/api/admin/auth/login')
  })

  it('reads an operator session and rejects other roles', () => {
    expect(readAdminLogin({ token: 'abc', role: 'OPERATOR', displayName: '值班', adminId: 7 })).toMatchObject({
      token: 'abc',
      role: 'OPERATOR',
      displayName: '值班',
      adminId: '7',
    })
    expect(readAdminMe({ adminId: 7, phone: '13800138000', role: 'OPERATOR', displayName: '值班' })).toMatchObject({
      adminId: '7',
      phone: '13800138000',
    })
    expect(ADMIN_API.me).toBe('/api/admin/auth/me')
    expect(readAdminLogin({ token: 'abc', role: 'AGENT' }).role).toBe('AGENT')
    expect(() => readAdminLogin({ token: 'abc', role: 'MERCHANT' })).toThrow('该账号不是运营账号')
    expect(() => readAdminLogin({ role: 'OPERATOR' })).toThrow('登录响应缺少令牌')
  })

  it('distinguishes a disabled account from a wrong password', () => {
    expect(describeAdminError(new ApiError('账号已停用', 403, 403))).toEqual({
      kind: 'disabled',
      message: ACCOUNT_DISABLED,
    })
    expect(ACCOUNT_DISABLED).toBe('账号已停用')
    expect(describeAdminError(new ApiError('手机号或密码不正确', 401, 401)).kind).toBe('unauthorized')
  })

  it('keeps the login form on phone and off the scaffold', () => {
    const source = readFileSync(new URL('../views/LoginView.vue', import.meta.url), 'utf8')
    const vite = readFileSync(new URL('../../vite.config.ts', import.meta.url), 'utf8')
    expect(source).toContain('name="phone"')
    expect(source).not.toContain('username')
    expect(source).not.toContain('脚手架')
    expect(source).toContain('loginAdmin')
    expect(vite).toContain('port: 43124')
    expect(vite).not.toContain('43125')
  })
})

describe('admin paths', () => {
  it('stays on /api/admin and keeps direct shelf off a separate POST', () => {
    const paths = Object.values(ADMIN_API)
    expect(paths.every((path) => path.startsWith('/api/admin/'))).toBe(true)
    expect(paths).not.toContain('/api/auth/login')
    expect(paths.some((path) => path.endsWith('/shelf') || path.startsWith('/api/merchant'))).toBe(false)
    expect(adminApplyApprovePath('3')).toBe('/api/admin/merchant-applies/3/approve')
    expect(adminApplyRejectPath('3')).toBe('/api/admin/merchant-applies/3/reject')
    expect(adminResetPasswordPath('9')).toBe('/api/admin/merchants/9/reset-password')
    expect(adminMerchantStoresPath('9')).toBe('/api/admin/merchants/9/stores')
    expect(ADMIN_API.shelfApplications).toBe('/api/admin/shelf-applications')
    expect(adminIntentStatusPath('2')).toBe('/api/admin/intents/2/status')
    expect(adminIntentNotesPath('2')).toBe('/api/admin/intents/2/notes')
    expect(ADMIN_API.intentExport).toBe('/api/admin/intents/export')
    expect(adminArticlePath('4')).toBe('/api/admin/articles/4')
    expect(ADMIN_API.siteConfig).toBe('/api/admin/site-config')
    expect(Object.keys(pageQuery(2))).toEqual(['page', 'pageSize'])
  })

  it('does not keep shell views on the router', () => {
    const source = readFileSync(new URL('../router/routes.ts', import.meta.url), 'utf8')
    expect(source).not.toContain('ShellView')
    expect(source).not.toContain('GuideShell')
  })
})

describe('admin review and merchants', () => {
  it('requires a reject reason and reads apply aliases', () => {
    expect(() => buildRejectBody('  ')).toThrow('请填写驳回原因')
    expect(buildRejectBody(' 资料不全 ')).toEqual({ reason: '资料不全' })
    expect(readMerchantApply({
      id: 1,
      orgName: '张家',
      plannedStoreName: '河畔',
      contactName: '张三',
      contactPhone: '13800138000',
      description: '想开店',
      licenseUrls: '["https://img.example/lic.jpg"]',
      status: 'PENDING',
      regionId: 12,
    })).toMatchObject({
      id: '1',
      orgName: '张家',
      plannedStoreName: '河畔',
      description: '想开店',
      licenseUrls: ['https://img.example/lic.jpg'],
      status: 'PENDING',
    })
  })

  it('patches org status and reads the one-time password', () => {
    expect(buildMerchantStatusBody('DISABLED')).toEqual({ status: 'DISABLED' })
    expect(Object.keys(buildMerchantStatusBody('ACTIVE'))).toEqual(['status'])
    expect(buildOptionalPassword('')).toEqual({})
    expect(buildOptionalPassword('secret1')).toEqual({ password: 'secret1' })
    expect(() => buildOptionalPassword('123')).toThrow('密码长度')
    expect(readPlainPassword({ plainPassword: 'once', phone: '13800138000', merchantUserId: 3 })).toEqual({
      plainPassword: 'once',
      phone: '13800138000',
      merchantOrgId: '',
      merchantUserId: '3',
    })
    expect(readMerchantOrg({
      id: 5,
      name: '张家',
      status: 'DISABLED',
      users: [{ id: 9, phone: '13800138000', displayName: '张三', enabled: false }],
    })).toMatchObject({
      id: '5',
      name: '张家',
      status: 'DISABLED',
      users: [{ id: '9', phone: '13800138000', enabled: false }],
    })
  })
})

describe('admin listings', () => {
  it('writes homeRecommended, homeSort, and shelfStatus on the same PUT', () => {
    const body = buildListingBody(listingDraft)
    expect(body.homeRecommended).toBe(true)
    expect(body.homeSort).toBe(1)
    expect(body.shelfStatus).toBe('OFF_SHELF')
    expect(Object.keys(body).sort()).toEqual([...STORE_UPDATE_KEYS].sort())
    for (const key of STORE_UPDATE_FORBIDDEN) expect(Object.hasOwn(body, key)).toBe(false)
    expect(JSON.stringify(body)).not.toMatch(/homeRecommendSort|amount|payment|佣金/)
  })

  it('rejects a non-integer sort weight', () => {
    expect(() => buildListingBody({ ...listingDraft, homeSortText: '1.5' })).toThrow('排序权重须为整数')
  })

  it('reads region and subject names when the payload has them', () => {
    expect(readStore({
      id: 8,
      merchantOrgId: 4,
      orgName: '张家',
      name: '河畔',
      regionId: 12,
      regionName: '兴化',
      shelfStatus: 'ON_SHELF',
      homeRecommended: false,
      homeSort: 100,
      version: 1,
      gallery: [],
    })).toMatchObject({
      orgName: '张家',
      regionName: '兴化',
      homeRecommended: false,
      homeSort: 100,
    })
  })
})

describe('admin intents', () => {
  it('renders only legal next statuses and calls checked-in 已入住', () => {
    expect(nextIntentStatuses('PENDING')).toEqual(['CONFIRMED', 'RESCHEDULED', 'CLOSED'])
    expect(nextIntentStatuses('CONFIRMED').map(intentStatusLabel)).toEqual(['已入住', '已关闭'])
    expect(nextIntentStatuses('RESCHEDULED')).toEqual(['CONFIRMED', 'CLOSED'])
    expect(nextIntentStatuses('CHECKED_IN')).toEqual([])
    expect(nextIntentStatuses('CLOSED')).toEqual([])
    expect(intentStatusLabel('CHECKED_IN')).toBe('已入住')
    expect(intentTagType('CONFIRMED')).toBe('info')
    expect(intentTagType('CONFIRMED')).not.toBe('primary')
    expect(intentTagType('PENDING')).toBe('warning')
    expect(intentTagType('CHECKED_IN')).toBe('success')
    expect(intentTagMuted('CLOSED')).toBe(true)
    expect(intentTagMuted('CONFIRMED')).toBe(false)
    expect(displayIntentStatus('CHECKED_IN', '已订立')).toBe('已入住')
    expect(displayIntentStatus('CHECKED_IN', '已入住')).toBe('已入住')
    expect(displayIntentStatus('CONFIRMED', '已确认')).toBe('已确认')
    expect(INTENT_STATUS_LABEL.CHECKED_IN).toBe('已入住')
    expect([...FORBIDDEN_INTENT_LABELS]).toEqual(['已订立', '已落实', '已落地', '已成交', '已达成'])
    for (const word of FORBIDDEN_INTENT_LABELS) {
      expect(displayIntentStatus('CHECKED_IN', word)).toBe('已入住')
      expect(displayIntentStatus('PENDING', word)).toBe('已入住')
      expect(presentIntentCsv(`状态\n${word}`)).toBe('状态\n已入住')
      expect(INTENT_STATUS_LABEL.CHECKED_IN).not.toBe(word)
    }
  })

  it('sends targetStatus and version on a status change', () => {
    expect(buildIntentStatusBody('CHECKED_IN', 3, ' 已到店 ')).toEqual({
      targetStatus: 'CHECKED_IN',
      version: 3,
      note: '已到店',
    })
    expect(buildIntentStatusBody('CLOSED', 3, '')).toEqual({ targetStatus: 'CLOSED', version: 3 })
    expect(() => buildIntentStatusBody('CLOSED', null, '')).toThrow('缺少版本号')
    expect(buildIntentNoteBody(' 再联系 ')).toEqual({ note: '再联系' })
    expect(() => buildIntentNoteBody(' ')).toThrow('请填写备注')
  })

  it('exports the filtered set without paging or a commission column', () => {
    expect(intentListQuery({
      status: 'CHECKED_IN',
      storeId: '8',
      merchantOrgId: '',
      checkInFrom: '2026-10-01',
      checkInTo: '2026-10-31',
      createdFrom: '',
      createdTo: '',
      page: 2,
    })).toEqual({
      status: 'CHECKED_IN',
      storeId: '8',
      checkInFrom: '2026-10-01',
      checkInTo: '2026-10-31',
      page: 2,
      pageSize: 20,
    })
    const exported = intentExportQuery({
      status: 'CONFIRMED',
      storeId: '',
      merchantOrgId: '',
      checkInFrom: '2026-10-01',
      checkInTo: '',
      createdFrom: '',
      createdTo: '',
      page: 2,
    })
    expect(exported).toEqual({ status: 'CONFIRMED', checkInFrom: '2026-10-01' })
    expect(exported).not.toHaveProperty('page')
    expect(exported).not.toHaveProperty('pageSize')
    expect(INTENT_CSV_HEADERS).not.toContain('佣金')
    const csv = intentsToCsv([
      {
        id: '1',
        intentNo: 'NJ1',
        status: 'CHECKED_IN',
        storeId: '8',
        storeName: '河畔',
        checkIn: '2026-10-20',
        checkOut: '2026-10-22',
        nights: 2,
        guests: 2,
        contactName: '张三',
        contactPhone: '13800138000',
        userRemark: '',
        createdAt: '',
        updatedAt: '2026-10-21 09:00',
        version: 1,
        statusLabel: '已订立',
        notes: [],
      },
    ])
    expect(csv).toContain('已入住')
    expect(csv).not.toContain('CHECKED_IN')
    expect(csv).not.toContain('已订立')
    expect(csv).not.toContain('佣金')
    expect(presentIntentCsv('状态\n已订立')).toBe('状态\n已入住')
    expect(readPage({ items: [], total: 0, page: 1, pageSize: 20 }, () => null).items).toEqual([])
    expect(() => readPage({}, () => null)).toThrow('列表响应缺少 items')
  })
})

describe('admin articles and site config', () => {
  it('writes article body and reads either body or content', () => {
    const body = buildArticleBody({
      title: ' 周末 ',
      coverUrl: '',
      summary: '摘要',
      body: '正文',
      status: 'PUBLISHED',
    })
    expect(body).toEqual({ title: '周末', coverUrl: '', summary: '摘要', body: '正文', status: 'PUBLISHED' })
    expect(Object.hasOwn(body, 'content')).toBe(false)
    expect(readArticle({ id: 3, title: '周末', content: '来自 content', status: 'DRAFT' })?.body).toBe('来自 content')
  })

  it('saves site name, brand color, and phone', () => {
    expect(buildSiteConfigBody({
      siteName: ' 站点名称 ',
      brandColor: '#4ba3d9',
      contactPhone: '400-000-0000',
    })).toEqual({
      siteName: '站点名称',
      brandColor: '#4BA3D9',
      contactPhone: '400-000-0000',
    })
    expect(() => buildSiteConfigBody({ siteName: '站点名称', brandColor: 'green', contactPhone: '400-000-0000' })).toThrow('主色')
    expect(readSiteConfig({
      siteName: '苏中',
      brandColor: '#4BA3D9',
      contactPhone: '400-000-0000',
    })).toEqual({
      siteName: '苏中',
      brandColor: '#4BA3D9',
      contactPhone: '400-000-0000',
    })
  })
})
