import { describe, expect, it } from 'vitest'
import { readRegions } from '../api/readers'
import { DESTINATION_PENDING, LISTINGS_LEAD } from './copy'
import { destinationRegions } from './filters'

describe('destinationRegions', () => {
  it('shows the finest districts when the tree has them', () => {
    expect(
      destinationRegions([
        { id: 1, name: '江苏省', parentId: null, level: null },
        { id: 2, name: '扬州市', parentId: 1, level: null },
        { id: 3, name: '广陵区', parentId: 2, level: null },
        { id: 4, name: '海陵区', parentId: 2, level: null },
      ]).map((item) => item.name),
    ).toEqual(['广陵区', '海陵区'])
  })

  it('shows direct children when there is no deeper level', () => {
    expect(
      destinationRegions([
        { id: 1, name: '江苏省', parentId: null, level: null },
        { id: 2, name: '广陵区', parentId: 1, level: null },
      ]).map((item) => item.name),
    ).toEqual(['广陵区'])
  })

  it('stays empty for a lone province so the page can offer the listings path', () => {
    expect(destinationRegions([{ id: 1, name: '江苏省', parentId: null, level: null }])).toEqual([])
    expect(destinationRegions([])).toEqual([])
  })

  it('shows only open cities when the region payload includes level', () => {
    expect(
      destinationRegions([
        { id: 1, name: '江苏省', parentId: null, level: 1 },
        { id: 2, name: '扬州市', parentId: 1, level: 2 },
        { id: 3, name: '泰州市', parentId: 1, level: 2 },
        { id: 4, name: '广陵区', parentId: 2, level: 3 },
      ]).map((item) => item.name),
    ).toEqual(['扬州市', '泰州市'])
  })

  it('recognizes API CITY rows and keeps CLOSED cities such as 南通 off the chips', () => {
    const items = readRegions([
      { id: 1, parentId: null, name: '江苏省', level: 'PROVINCE' },
      { id: 2, parentId: 1, name: '扬州市', level: 'CITY' },
      { id: 5, parentId: 2, name: '广陵区', level: 'DISTRICT' },
      { id: 3, parentId: 1, name: '泰州市', level: 'CITY' },
      { id: 6, parentId: 3, name: '海陵区', level: 'DISTRICT' },
      { id: 9, parentId: 1, name: '南通市', level: 'CITY', openStatus: 'CLOSED' },
      { id: 10, parentId: 9, name: '崇川区', level: 'DISTRICT' },
    ])
    expect(items.find((item) => item.name === '扬州市')?.level).toBe('CITY')
    expect(destinationRegions(items).map((item) => item.name)).toEqual(['扬州市', '泰州市'])
    expect(
      destinationRegions(items.filter((item) => item.name === '南通市' || item.name === '崇川区' || item.name === '江苏省')).map(
        (item) => item.name,
      ),
    ).toEqual([])
  })

  it('keeps several sibling roots selectable', () => {
    expect(
      destinationRegions([
        { id: 2, name: '扬州市', parentId: null, level: null },
        { id: 3, name: '泰州市', parentId: null, level: null },
      ]).map((item) => item.name),
    ).toEqual(['扬州市', '泰州市'])
  })
})

describe('visitor copy', () => {
  it('does not use the operator shelf word on the public list', () => {
    expect(LISTINGS_LEAD).toContain('以下为可提交意向的农家乐')
    expect(LISTINGS_LEAD).not.toContain('上架')
    expect(DESTINATION_PENDING).toBe('目的地筹备中，先去找农家乐')
    expect(DESTINATION_PENDING).not.toContain('暂无地区')
  })
})
