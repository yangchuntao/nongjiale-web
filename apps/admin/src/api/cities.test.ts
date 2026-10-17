import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  ADMIN_API,
  adminCityChecklistPath,
  adminCityClosePath,
  adminCityOpenPath,
  adminCityPath,
} from './paths'
import {
  buildChecklistPatch,
  buildCityVersionBody,
  cityIntentCities,
  cityIntentQuery,
  cityIntentTotal,
  cityTitle,
  filterCities,
  openStatusLabel,
  readCityDetail,
  readCityIntentMetrics,
  readCityList,
  type CitySummary,
} from './readers'

const yangzhou: CitySummary = {
  id: '2',
  provinceName: '江苏省',
  name: '扬州市',
  slug: 'yangzhou',
  openStatus: 'CLOSED',
  storeCount: 1,
  articleCount: 0,
  updatedAt: '',
}

describe('city open contract', () => {
  it('lists enabled cities and keeps null open status as closed', () => {
    expect(ADMIN_API.cities).toBe('/api/admin/cities')
    expect(adminCityPath('2')).toBe('/api/admin/cities/2')
    expect(adminCityChecklistPath('2')).toBe('/api/admin/cities/2/checklist')
    expect(adminCityOpenPath('2')).toBe('/api/admin/cities/2/open')
    expect(adminCityClosePath('2')).toBe('/api/admin/cities/2/close')
    expect(
      readCityList([
        { id: 2, provinceName: '江苏省', name: '扬州市', slug: 'yangzhou', openStatus: null, storeCount: 1, articleCount: 0 },
      ]),
    ).toEqual([
      {
        id: '2',
        provinceName: '江苏省',
        name: '扬州市',
        slug: 'yangzhou',
        openStatus: 'CLOSED',
        storeCount: 1,
        articleCount: 0,
        updatedAt: '',
      },
    ])
    expect(openStatusLabel('OPEN')).toBe('已开通')
    expect(openStatusLabel('CLOSED')).toBe('未开通')
    expect(cityTitle(yangzhou)).toBe('江苏省 · 扬州市')
  })

  it('reads checklist counters and does not treat supply or articles as hand fields', () => {
    const detail = readCityDetail({
      id: 2,
      name: '扬州市',
      provinceName: '江苏省',
      openStatus: 'CLOSED',
      storeCount: 1,
      articleCount: 0,
      minStores: 5,
      minArticles: 1,
      version: 0,
      checklist: {
        destinationReady: true,
        supplyReady: false,
        articlesReady: false,
        supportCovered: false,
        dirtyDataCleared: true,
      },
      canOpen: false,
      canClose: false,
      missingReasons: ['供给未达标（当前 1 / 需要 5）'],
    })
    expect(detail?.checklist.supplyReady).toBe(false)
    expect(detail?.checklist.articlesReady).toBe(false)
    expect(detail?.canOpen).toBe(false)
    expect(detail?.minStores).toBe(5)
    expect(detail?.missingReasons).toEqual(['供给未达标（当前 1 / 需要 5）'])
    const patch = buildChecklistPatch(0, { destinationReady: true })
    expect(patch).toEqual({ version: 0, destinationReady: true })
    expect(patch).not.toHaveProperty('supplyReady')
    expect(patch).not.toHaveProperty('articlesReady')
    expect(Object.keys(buildCityVersionBody(4))).toEqual(['version'])
    expect(() => buildChecklistPatch(1, {})).toThrow('请指定要更新的项')
  })

  it('filters the city list on the client', () => {
    const rows: CitySummary[] = [
      yangzhou,
      { ...yangzhou, id: '3', name: '泰州市', slug: 'taizhou', openStatus: 'OPEN', storeCount: 6, articleCount: 2 },
    ]
    expect(filterCities(rows, { status: 'OPEN', province: '', keyword: '' }).map((row) => row.name)).toEqual(['泰州市'])
    expect(filterCities(rows, { status: '', province: '江苏省', keyword: '扬州' }).map((row) => row.id)).toEqual(['2'])
  })

  it('reads seed totals without a drill-down field', () => {
    expect(ADMIN_API.cityIntents).toBe('/api/admin/metrics/city-intents')
    expect(ADMIN_API.cityIntentExport).toBe('/api/admin/metrics/city-intents/export')
    expect(cityIntentQuery({ window: '7', cityId: '' })).toEqual({ window: '7' })
    expect(cityIntentQuery({ window: 'ALL', cityId: '2' })).toEqual({ window: 'ALL', cityId: '2' })
    const metrics = readCityIntentMetrics({
      window: '7',
      from: '2026-10-10T00:00:00+08:00',
      rows: [
        { cityId: null, cityName: '合计', intentCount: 4, confirmedCount: 1, checkedInCount: 1, total: true, href: '/api/admin/intents' },
        { cityId: 2, cityName: '扬州市', intentCount: 4, confirmedCount: 1, checkedInCount: 1, total: false },
      ],
    })
    expect(cityIntentTotal(metrics)).toMatchObject({ cityName: '合计', intentCount: 4, checkedInCount: 1, total: true })
    expect(cityIntentCities(metrics)).toEqual([
      { cityId: '2', cityName: '扬州市', intentCount: 4, confirmedCount: 1, checkedInCount: 1, total: false },
    ])
    expect(metrics.rows[0]).not.toHaveProperty('href')
    expect(metrics.window).toBe('7')
  })
})

describe('city open pages', () => {
  it('keeps checklist 2 and 3 automatic and does not drill the seed board into intents', () => {
    const detail = readFileSync(new URL('../views/CityDetailView.vue', import.meta.url), 'utf8')
    const seed = readFileSync(new URL('../views/SeedMetricsView.vue', import.meta.url), 'utf8')
    const list = readFileSync(new URL('../views/CitiesView.vue', import.meta.url), 'utf8')
    expect(detail).toContain('开通此市')
    expect(detail).toContain('关闭开通')
    expect(detail).toContain('CHECKLIST_AUTO_HINT')
    expect(detail).not.toContain('强制开通')
    expect(detail).not.toContain('supplyReady:')
    expect(detail).not.toContain('articlesReady:')
    expect(detail).not.toMatch(/付定金|去支付|定金|收银台/)
    expect(seed).toContain('已入住')
    expect(seed).not.toContain('/intents')
    expect(seed).not.toContain('RouterLink')
    expect(seed).not.toMatch(/已订立|已落实|已落地|已成交|已达成/)
    expect(list).toContain('进入详情')
    expect(list).not.toContain('/intents')
  })
})
