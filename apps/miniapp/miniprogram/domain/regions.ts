export interface RegionItem {
  id: number
  name: string
  slug: string
  parentId: number | null
  level: number | string | null
  openStatus: string
}

export function isCityLevel(level: RegionItem['level']): boolean {
  if (level === 2) return true
  return typeof level === 'string' && level.trim().toUpperCase() === 'CITY'
}

export function isClosedRegion(item: RegionItem): boolean {
  return item.openStatus.toUpperCase() === 'CLOSED'
}

/** 目的地 Chip 只含 OPEN 市。CLOSED 不可选。 */
export function openCityRegions(items: readonly RegionItem[]): RegionItem[] {
  const cities = items.filter((item) => isCityLevel(item.level))
  if (cities.length) return cities.filter((item) => !isClosedRegion(item))
  return items.filter((item) => !isClosedRegion(item) && item.parentId != null)
}

export function findOpenCityBySlug(items: readonly RegionItem[], slug: string): RegionItem | null {
  const key = slug.trim()
  if (!key) return null
  return openCityRegions(items).find((item) => item.slug === key) ?? null
}
