import { describe, expect, it } from 'vitest'
import { ADMIN_API, adminBannerDisablePath, adminBannerEnablePath, adminBannerPath } from './paths'
import {
  BANNER_CITY_CLOSED,
  bannerFieldErrors,
  bannerListQuery,
  buildBannerBody,
  openBannerCities,
  readBanner,
  readPage,
  type BannerDraft,
  type CitySummary,
} from './readers'

const draft: BannerDraft = {
  title: '',
  imageUrl: 'https://img.example/a.jpg',
  linkUrl: '/listings?regionId=1',
  scope: 'ALL',
  cityId: '',
  sortOrderText: '100',
  enabled: true,
}

describe('admin banner contract', () => {
  it('uses the locked admin paths and enable/disable verbs', () => {
    expect(ADMIN_API.banners).toBe('/api/admin/banners')
    expect(adminBannerPath('a/b')).toBe('/api/admin/banners/a%2Fb')
    expect(adminBannerEnablePath('9')).toBe('/api/admin/banners/9/enable')
    expect(adminBannerDisablePath('9')).toBe('/api/admin/banners/9/disable')
    expect(BANNER_CITY_CLOSED).toBe('投放市未开通，请改选全站或其他已开通市')
  })

  it('reads a paged admin banner and keeps cityOpen null for ALL', () => {
    const page = readPage(
      {
        items: [
          {
            id: 4,
            title: null,
            imageUrl: 'https://img.example/a.jpg',
            linkUrl: '/',
            scope: 'ALL',
            cityId: null,
            citySlug: null,
            cityName: null,
            cityOpen: null,
            sortOrder: 100,
            enabled: true,
            createdAt: '2026-10-18 09:00',
            updatedAt: '2026-10-18 09:00',
            clickCount: 99,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
      readBanner,
    )
    expect(page.total).toBe(1)
    expect(page.items[0]).toMatchObject({
      id: '4',
      scope: 'ALL',
      cityId: null,
      cityOpen: null,
      sortOrder: 100,
      enabled: true,
    })
    expect(page.items[0]).not.toHaveProperty('clickCount')
  })

  it('keeps a closed-city flag for the operator list', () => {
    expect(
      readBanner({
        id: 5,
        imageUrl: 'https://img.example/b.jpg',
        linkUrl: '/guides',
        scope: 'CITY',
        cityId: 3,
        citySlug: 'nantong',
        cityName: '南通',
        cityOpen: false,
        sortOrder: 20,
        enabled: true,
        createdAt: '',
        updatedAt: '',
      }),
    ).toMatchObject({
      cityId: '3',
      cityName: '南通',
      cityOpen: false,
    })
  })

  it('writes create and update bodies with sortOrder and a numeric cityId', () => {
    expect(buildBannerBody(draft)).toEqual({
      imageUrl: 'https://img.example/a.jpg',
      linkUrl: '/listings?regionId=1',
      scope: 'ALL',
      title: null,
      sortOrder: 100,
      enabled: true,
      cityId: null,
    })
    expect(
      buildBannerBody({
        ...draft,
        title: ' 春游 ',
        scope: 'CITY',
        cityId: '12',
        sortOrderText: '2',
        enabled: false,
      }),
    ).toEqual({
      imageUrl: 'https://img.example/a.jpg',
      linkUrl: '/listings?regionId=1',
      scope: 'CITY',
      title: '春游',
      sortOrder: 2,
      enabled: false,
      cityId: 12,
    })
    expect(Object.keys(buildBannerBody(draft))).not.toContain('sort')
  })

  it('lists with page filters and does not send a client sort', () => {
    expect(
      bannerListQuery({ page: 2, enabled: 'true', scope: 'CITY', keyword: ' 扬州 ' }),
    ).toEqual({
      page: 2,
      pageSize: 20,
      enabled: 'true',
      scope: 'CITY',
      keyword: '扬州',
    })
    expect(bannerListQuery({ page: 1, enabled: '', scope: '', keyword: ' ' })).toEqual({
      page: 1,
      pageSize: 20,
    })
  })

  it('offers only OPEN cities and blocks a closed target', () => {
    const cities: CitySummary[] = [
      { id: '1', provinceName: '江苏省', name: '扬州', slug: 'yangzhou', openStatus: 'OPEN', storeCount: 1, articleCount: 1, updatedAt: '' },
      { id: '3', provinceName: '江苏省', name: '南通', slug: 'nantong', openStatus: 'CLOSED', storeCount: 0, articleCount: 0, updatedAt: '' },
    ]
    expect(openBannerCities(cities).map((city) => city.name)).toEqual(['扬州'])
    expect(bannerFieldErrors({ ...draft, imageUrl: '', linkUrl: '' }, new Set(['1']))).toMatchObject({
      imageUrl: '请填写图片地址',
      linkUrl: '请填写跳转链接',
    })
    expect(
      bannerFieldErrors(
        { ...draft, imageUrl: 'blob:https://img.example/1', linkUrl: 'javascript:alert(1)', sortOrderText: '-1' },
        new Set(['1']),
      ),
    ).toMatchObject({
      imageUrl: '请填写图片地址',
      linkUrl: '请填写站内路径或 http(s) 链接',
      sortOrder: '请输入整数排序值',
    })
    expect(
      bannerFieldErrors({ ...draft, scope: 'CITY', cityId: '3' }, new Set(['1'])).cityId,
    ).toBe('请选择已开通的市')
    expect(bannerFieldErrors({ ...draft, scope: 'CITY', cityId: '1' }, new Set(['1'])).cityId).toBe('')
  })
})
