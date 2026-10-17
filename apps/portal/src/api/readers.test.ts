import { describe, expect, it } from 'vitest'
import { intentStatusLabel, intentStatusTone, portalVisitorTags, readAuthToken, readHomeFeed, readIntent, readRegions } from './readers'

describe('portal readers', () => {
  it('reads a home feed without inventing stores', () => {
    expect(readHomeFeed({ stores: null, articles: [] })).toEqual({ stores: [], articles: [] })
    const feed = readHomeFeed({
      stores: [{ id: 2, name: '后', homeSort: 2 }, { id: 1, name: '先', homeSort: 1 }],
      articles: [{ id: 9, title: '周末', summary: '摘要' }],
    })
    expect(feed.stores.map((store) => store.id)).toEqual([1, 2])
    expect(feed.articles[0]?.title).toBe('周末')
  })

  it('flattens region trees and reads Jackson date arrays', () => {
    expect(readRegions([{ id: 1, name: '扬州', children: [{ id: 2, name: '广陵' }] }])).toEqual([
      { id: 1, name: '扬州', parentId: null },
      { id: 2, name: '广陵', parentId: 1 },
    ])
    const intent = readIntent({
      id: 4,
      intentNo: 'I4',
      status: 'CHECKED_IN',
      checkIn: [2026, 10, 20],
      createdAt: [2026, 10, 15, 9, 30],
    })
    expect(intent?.checkIn).toBe('2026-10-20')
    expect(intent?.createdAt).toBe('2026-10-15 09:30')
    expect(intentStatusLabel('CHECKED_IN')).toBe('已入住')
  })

  it('formats ISO timestamps for display and keeps calendar dates', () => {
    const intent = readIntent({
      id: 5,
      checkIn: '2026-10-20',
      checkOut: '2026-10-22T00:00:00',
      createdAt: '2026-10-16T05:12:00.000Z',
    })
    expect(intent?.checkIn).toBe('2026-10-20')
    expect(intent?.checkOut).toBe('2026-10-22')
    expect(intent?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(intent?.createdAt).not.toContain('T')
  })

  it('keeps visitor tags and hides operator chips on the detail page', () => {
    expect(portalVisitorTags({ testTag: '采摘', testData: false })).toEqual(['采摘'])
    expect(portalVisitorTags({ testData: true })).toEqual(['测试'])
    expect(portalVisitorTags({})).toEqual([])
    expect(
      portalVisitorTags({
        homeRecommended: true,
        homeSort: 1,
        shelfStatus: 'ON_SHELF',
        testTag: '采摘',
      }),
    ).toEqual(['首页推荐', '采摘'])
    expect(
      portalVisitorTags({
        homeRecommended: false,
        homeSort: 1,
        shelfStatus: 'ON_SHELF',
        testTag: '排序 1',
      }),
    ).toEqual([])
    expect(portalVisitorTags({ homeSort: 4, shelfStatus: 'OFF_SHELF', testTag: '上架' })).toEqual([])
    expect(intentStatusTone('CONFIRMED')).toBe('info')
    expect(intentStatusTone('CHECKED_IN')).toBe('success')
  })

  it('reads bearer tokens from common fields', () => {
    expect(readAuthToken({ accessToken: 'abc' })).toBe('abc')
    expect(readAuthToken(' raw ')).toBe('raw')
    expect(() => readAuthToken({ userId: 1 })).toThrow(/令牌/)
  })
})
