import { KEYWORD_MAX, PAGE_SIZE } from '../config'

export interface StoreListQueryInput {
  regionId?: number | null
  keyword?: string
  page: number
  pageSize?: number
}

export function storeListQuery(
  input: StoreListQueryInput,
): { ok: true; query: Record<string, string | number> } | { ok: false; message: string } {
  const keyword = input.keyword?.trim() ?? ''
  if ([...keyword].length > KEYWORD_MAX) return { ok: false, message: '参数不正确' }
  const page = input.page > 0 ? input.page : 1
  const query: Record<string, string | number> = {
    page,
    pageSize: input.pageSize ?? PAGE_SIZE,
  }
  if (input.regionId != null && Number.isFinite(input.regionId)) query.regionId = input.regionId
  if (keyword) query.keyword = keyword
  return { ok: true, query }
}

export function storeSharePath(storeId: number): string {
  return `/pages/detail/index?id=${storeId}`
}

export function shareImageUrl(coverUrl: string | null | undefined): string {
  const value = coverUrl?.trim() ?? ''
  if (/^https:\/\//i.test(value)) return value
  return ''
}

export function priceLabel(priceText?: string | null, priceFrom?: number | string | null): string {
  const textValue = priceText?.trim()
  if (textValue) return textValue
  if (priceFrom === null || priceFrom === undefined || priceFrom === '') return ''
  return `¥${priceFrom} 起`
}

export function canSubmitIntent(shelfStatus: string | null | undefined, gone: boolean): boolean {
  if (gone) return false
  return !shelfStatus || shelfStatus === 'ON_SHELF'
}

const OPERATOR_VISITOR_LABELS = new Set(['上架', '已上架', '未上架', '下架', '已下架', 'ON_SHELF', 'OFF_SHELF'])

export function visitorTags(store: {
  testData?: boolean
  testTag?: string
  homeRecommended?: boolean
}): string[] {
  const tags: string[] = []
  if (store.homeRecommended) tags.push('首页推荐')
  const label = store.testTag?.trim() || (store.testData ? '测试' : '')
  if (label && !tags.includes(label) && !OPERATOR_VISITOR_LABELS.has(label) && !/^排序\s*\d+$/.test(label)) {
    tags.push(label)
  }
  return tags
}

export function articlePlainText(content: string): string {
  return content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

export function listEmptyCopy(keyword: string): string {
  return keyword.trim() ? '未找到相关门店' : '该市暂无上架农家乐'
}
