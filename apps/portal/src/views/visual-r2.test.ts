import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

function template(relative: string): string {
  const text = source(relative)
  const start = text.indexOf('<template>')
  return text.slice(start)
}

describe('visual round 2 portal presentation', () => {
  it('keeps operator chips off the listing detail and sticks the intent action', () => {
    const view = source('./ListingDetailView.vue')
    const markup = template('./ListingDetailView.vue')
    expect(view).toContain('portalVisitorTags')
    expect(view).toContain('query: { redirect: intentTo }')
    expect(markup).toContain('提交意向')
    expect(markup).toContain('拨打电话')
    expect(markup).toContain('btn-ghost')
    expect(markup).toContain('INTENT_NOTICE')
    expect(markup).toContain('start-collapsed')
    expect(markup).not.toContain('homeSort')
    expect(markup).not.toContain('shelfStatus')
    expect(markup).not.toContain('排序')
    expect(markup).not.toContain('上架')
    expect(markup).not.toMatch(/付定金|去支付|已订立|已落实|已落地|已成交|已达成/)
  })

  it('describes the public list without the shelf word and keeps chip filters', () => {
    const markup = template('./ListingsView.vue')
    expect(markup).toContain('LISTINGS_LEAD')
    expect(markup).not.toContain('上架')
    expect(markup).toContain('class="chip"')
    expect(markup).toContain('class="segmented"')
    expect(markup).toContain('btn-text')
    expect(markup).toContain('清空筛选')
    expect(markup).toContain('联系客服')
    expect(markup).not.toContain('<select')
  })

  it('offers district chips or an open listings path from home', () => {
    const view = source('./HomeView.vue')
    const markup = template('./HomeView.vue')
    expect(view).toContain('destinationRegions')
    expect(view).toContain("query: { tag }")
    expect(markup).toContain('DESTINATION_PENDING')
    expect(markup).toContain('找农家乐')
    expect(markup).not.toContain('暂无地区')
  })

  it('caps the empty photo and keeps the detail action bar', () => {
    const css = source('../styles/portal.css')
    expect(css).toContain('max-height: 360px')
    expect(css).toContain('aspect-ratio: 4 / 3')
    expect(css).toContain('aspect-ratio: 16 / 10')
    expect(css).toMatch(/\.cover-fallback\s*\{[^}]*height:\s*180px/)
    expect(css).toContain('height: 140px')
    expect(css).toContain('position: fixed')
    expect(css).toContain('position: sticky')
    expect(css).toContain('.btn-ghost')
  })
})
