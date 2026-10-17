import { describe, expect, it } from 'vitest'
import { DESTINATION_PENDING, LISTINGS_LEAD } from './copy'
import { destinationRegions } from './filters'

describe('destinationRegions', () => {
  it('shows the finest districts when the tree has them', () => {
    expect(
      destinationRegions([
        { id: 1, name: '江苏省', parentId: null },
        { id: 2, name: '扬州市', parentId: 1 },
        { id: 3, name: '广陵区', parentId: 2 },
        { id: 4, name: '海陵区', parentId: 2 },
      ]).map((item) => item.name),
    ).toEqual(['广陵区', '海陵区'])
  })

  it('shows direct children when there is no deeper level', () => {
    expect(
      destinationRegions([
        { id: 1, name: '江苏省', parentId: null },
        { id: 2, name: '广陵区', parentId: 1 },
      ]).map((item) => item.name),
    ).toEqual(['广陵区'])
  })

  it('stays empty for a lone province so the page can offer the listings path', () => {
    expect(destinationRegions([{ id: 1, name: '江苏省', parentId: null }])).toEqual([])
    expect(destinationRegions([])).toEqual([])
  })

  it('keeps several sibling roots selectable', () => {
    expect(
      destinationRegions([
        { id: 2, name: '扬州市', parentId: null },
        { id: 3, name: '泰州市', parentId: null },
      ]).map((item) => item.name),
    ).toEqual(['扬州市', '泰州市'])
  })
})

describe('visitor copy', () => {
  it('does not use the operator shelf word on the public list', () => {
    expect(LISTINGS_LEAD).toContain('以下为可提交意向的农家乐')
    expect(LISTINGS_LEAD).not.toContain('上架')
    expect(DESTINATION_PENDING).toBe('按地区挑选（更多目的地即将开通）')
    expect(DESTINATION_PENDING).not.toContain('暂无地区')
  })
})
