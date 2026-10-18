export type BannerScope = 'ALL' | 'CITY'

export interface HomeBanner {
  id: string
  title: string | null
  imageUrl: string
  linkUrl: string
  scope: BannerScope
  cityId: string | null
  citySlug: string | null
  cityName: string | null
  sortOrder: number
  enabled: boolean
}

export const BANNER_INTERVAL_MS = 5000

export type BannerFrame = 'hidden' | 'still' | 'carousel'

export type BannerLink =
  | { kind: 'internal'; href: string }
  | { kind: 'external'; href: string }
  | { kind: 'unsafe' }

export function bannerFrame(count: number): BannerFrame {
  if (count <= 0) return 'hidden'
  if (count === 1) return 'still'
  return 'carousel'
}

/** 两张及以上、未暂停、且用户未要求减少动效时才自动切换。 */
export function bannerAutoplay(count: number, paused: boolean, reduceMotion: boolean): boolean {
  return count >= 2 && !paused && !reduceMotion
}

export function stepBanner(length: number, index: number, delta: number): number {
  if (length <= 0) return 0
  return (index + delta + length * 8) % length
}

function idRank(id: string): number | null {
  if (!/^\d+$/.test(id)) return null
  const value = Number(id)
  return Number.isSafeInteger(value) ? value : null
}

export function compareBannerIds(left: string, right: string): number {
  const leftRank = idRank(left)
  const rightRank = idRank(right)
  if (leftRank !== null && rightRank !== null && leftRank !== rightRank) return leftRank - rightRank
  if (left === right) return 0
  return left < right ? -1 : 1
}

/**
 * 公开接口已经排除未启用项和非 OPEN 的指定市。
 * 这里只丢掉异常的 enabled=false，并按 sortOrder、id 稳定排序。
 * 不按市名或地区列表再剔一遍。
 */
export function visibleHomeBanners(items: readonly HomeBanner[]): HomeBanner[] {
  return items
    .filter((item) => item.enabled === true)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || compareBannerIds(left.id, right.id))
}

export function classifyBannerLink(linkUrl: string): BannerLink {
  const href = linkUrl.trim()
  if (href.startsWith('/') && !href.startsWith('//') && !href.includes('\\')) {
    return { kind: 'internal', href }
  }
  if (/^https?:\/\//i.test(href)) return { kind: 'external', href }
  return { kind: 'unsafe' }
}

export function bannerAlt(title: string | null | undefined): string {
  const next = title?.trim() ?? ''
  return next || '活动宣传'
}
