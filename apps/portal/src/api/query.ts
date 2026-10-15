/** 门户房源列表只传 BE-4 已有查询参数。接口没有 keyword。 */
export const LISTING_SORTS = ['comprehensive', 'price_asc', 'price_desc'] as const

export type ListingSort = (typeof LISTING_SORTS)[number]

export const LISTING_PAGE_SIZE = 20

const LISTING_KEYS = ['regionId', 'tag', 'priceMin', 'priceMax', 'sort', 'page', 'pageSize'] as const

export function mapListingSearch(params: Record<string, string | undefined>): Record<string, string> {
  const next: Record<string, string> = {}
  for (const key of LISTING_KEYS) {
    const value = params[key]?.trim()
    if (!value) continue
    next[key] = value
  }
  if (!next.tag) {
    const fromSearch = params.q?.trim()
    if (fromSearch) next.tag = fromSearch
  }
  if (next.sort && !LISTING_SORTS.includes(next.sort as ListingSort)) delete next.sort
  if (next.page && !/^[1-9]\d*$/.test(next.page)) delete next.page
  if (next.pageSize && !/^[1-9]\d*$/.test(next.pageSize)) delete next.pageSize
  for (const key of ['priceMin', 'priceMax', 'regionId'] as const) {
    if (next[key] && Number.isNaN(Number(next[key]))) delete next[key]
  }
  return next
}

export function readRouteQueryValue(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw : undefined
}
