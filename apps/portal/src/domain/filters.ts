import type { RegionItem } from '../api/readers'
import type { ListingSort } from '../api/query'
import { LISTING_SORTS } from '../api/query'

export const PRICE_BANDS = [
  { id: 'any', label: '不限', priceMin: '', priceMax: '' },
  { id: 'lt200', label: '200 元以下', priceMin: '', priceMax: '200' },
  { id: '200-500', label: '200–500 元', priceMin: '200', priceMax: '500' },
  { id: '500-1000', label: '500–1000 元', priceMin: '500', priceMax: '1000' },
  { id: 'gte1000', label: '1000 元以上', priceMin: '1000', priceMax: '' },
] as const

export const SORT_OPTIONS: { id: ListingSort; label: string }[] = [
  { id: 'comprehensive', label: '综合' },
  { id: 'price_asc', label: '价格从低到高' },
  { id: 'price_desc', label: '价格从高到低' },
]

export function priceBandId(priceMin: string, priceMax: string): string {
  return PRICE_BANDS.find((band) => band.priceMin === priceMin && band.priceMax === priceMax)?.id ?? 'custom'
}

export function normalizeSort(value: string | undefined): ListingSort {
  return LISTING_SORTS.includes(value as ListingSort) ? (value as ListingSort) : 'comprehensive'
}

export function orderRegions(items: RegionItem[]): RegionItem[] {
  const roots = items.filter((item) => item.parentId == null)
  if (!roots.length) return items
  const ordered: RegionItem[] = []
  const seen = new Set<number>()
  for (const root of roots) {
    ordered.push(root)
    seen.add(root.id)
    for (const child of items) {
      if (child.parentId === root.id && !seen.has(child.id)) {
        ordered.push(child)
        seen.add(child.id)
      }
    }
  }
  for (const item of items) {
    if (!seen.has(item.id)) ordered.push(item)
  }
  return ordered
}

export function rootRegions(items: RegionItem[]): RegionItem[] {
  const roots = items.filter((item) => item.parentId == null)
  return roots.length ? roots : items
}
