import { describe, expect, it } from 'vitest'
import { readHomeBanners } from '../api/readers'
import {
  BANNER_INTERVAL_MS,
  bannerAlt,
  bannerAutoplay,
  bannerFrame,
  classifyBannerLink,
  stepBanner,
  visibleHomeBanners,
  type HomeBanner,
} from './banners'

function banner(overrides: Partial<HomeBanner> = {}): HomeBanner {
  return {
    id: '1',
    title: null,
    imageUrl: 'https://img.example/a.jpg',
    linkUrl: '/listings',
    scope: 'ALL',
    cityId: null,
    citySlug: null,
    cityName: null,
    sortOrder: 100,
    enabled: true,
    ...overrides,
  }
}

describe('visibleHomeBanners', () => {
  it('orders by sortOrder ascending and breaks ties by id', () => {
    const shown = visibleHomeBanners([
      banner({ id: '10', sortOrder: 2 }),
      banner({ id: '2', sortOrder: 2 }),
      banner({ id: '3', sortOrder: 1 }),
    ])
    expect(shown.map((item) => item.id)).toEqual(['3', '2', '10'])
  })

  it('drops a disabled row and keeps every enabled city row the server returned', () => {
    const shown = visibleHomeBanners([
      banner({ id: '1', enabled: false, scope: 'ALL' }),
      banner({
        id: '9',
        scope: 'CITY',
        cityId: '3',
        citySlug: 'nantong',
        cityName: '南通',
        sortOrder: 1,
      }),
    ])
    expect(shown.map((item) => item.id)).toEqual(['9'])
  })

  it('hides nothing, holds one frame, and carousels from two', () => {
    expect(bannerFrame(0)).toBe('hidden')
    expect(bannerFrame(1)).toBe('still')
    expect(bannerFrame(2)).toBe('carousel')
    expect(BANNER_INTERVAL_MS).toBe(5000)
    expect(bannerAutoplay(2, false, false)).toBe(true)
    expect(bannerAutoplay(1, false, false)).toBe(false)
    expect(bannerAutoplay(2, true, false)).toBe(false)
    expect(bannerAutoplay(2, false, true)).toBe(false)
    expect(stepBanner(3, 2, 1)).toBe(0)
    expect(stepBanner(3, 0, -1)).toBe(2)
  })
})

describe('classifyBannerLink', () => {
  it('keeps an in-site path in this tab, including query and hash', () => {
    expect(classifyBannerLink('/listings?regionId=1#top')).toEqual({
      kind: 'internal',
      href: '/listings?regionId=1#top',
    })
  })

  it('opens http(s) in a new tab and refuses other schemes', () => {
    expect(classifyBannerLink('https://example.com/a')).toEqual({
      kind: 'external',
      href: 'https://example.com/a',
    })
    expect(classifyBannerLink('HTTP://example.com')).toMatchObject({ kind: 'external' })
    expect(classifyBannerLink('javascript:alert(1)')).toEqual({ kind: 'unsafe' })
    expect(classifyBannerLink('//evil.example')).toEqual({ kind: 'unsafe' })
    expect(classifyBannerLink('data:text/html,hi')).toEqual({ kind: 'unsafe' })
    expect(classifyBannerLink('blob:https://img.example/1')).toEqual({ kind: 'unsafe' })
    expect(classifyBannerLink('')).toEqual({ kind: 'unsafe' })
  })
})

describe('bannerAlt', () => {
  it('uses the operator title or the default activity label', () => {
    expect(bannerAlt('  春游  ')).toBe('春游')
    expect(bannerAlt(null)).toBe('活动宣传')
    expect(bannerAlt('   ')).toBe('活动宣传')
  })
})

describe('readHomeBanners', () => {
  it('reads a public array and ignores the old items envelope', () => {
    const rows = readHomeBanners([
      {
        id: 8,
        title: null,
        imageUrl: 'https://img.example/a.jpg',
        linkUrl: 'https://example.com',
        scope: 'ALL',
        cityId: null,
        citySlug: null,
        cityName: null,
        sortOrder: 100,
        enabled: true,
      },
    ])
    expect(rows).toEqual([
      banner({
        id: '8',
        linkUrl: 'https://example.com',
      }),
    ])
    expect(readHomeBanners({ items: [banner()] })).toEqual([])
    expect(readHomeBanners([])).toEqual([])
  })

  it('skips a row that lacks the locked fields and keeps an explicit disabled flag', () => {
    const rows = readHomeBanners([
      { id: 1, scope: 'ALL', sortOrder: 1, enabled: true },
      {
        id: 2,
        imageUrl: 'https://img.example/b.jpg',
        linkUrl: '/guides',
        scope: 'CITY',
        cityId: 2,
        citySlug: 'yangzhou',
        cityName: '扬州',
        sortOrder: 4,
        enabled: false,
        title: '  周末  ',
      },
    ])
    expect(rows).toEqual([
      banner({
        id: '2',
        title: '周末',
        imageUrl: 'https://img.example/b.jpg',
        linkUrl: '/guides',
        scope: 'CITY',
        cityId: '2',
        citySlug: 'yangzhou',
        cityName: '扬州',
        sortOrder: 4,
        enabled: false,
      }),
    ])
  })
})
