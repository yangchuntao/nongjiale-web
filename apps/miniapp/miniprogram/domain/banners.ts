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

export type BannerFrame = 'hidden' | 'still' | 'carousel'

export type MiniBannerAction =
  | { kind: 'home' }
  | { kind: 'list'; slug: string }
  | { kind: 'external'; href: string }
  | { kind: 'toast' }
  | { kind: 'ignore' }

export function bannerFrame(count: number): BannerFrame {
  if (count <= 0) return 'hidden'
  if (count === 1) return 'still'
  return 'carousel'
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

/** 丢掉 enabled=false，按 sortOrder、id 升序。不再按 CLOSED 市过滤。 */
export function visibleHomeBanners(items: readonly HomeBanner[]): HomeBanner[] {
  return items
    .filter((item) => item.enabled === true)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || compareBannerIds(left.id, right.id))
}

export function bannerAlt(title: string | null | undefined): string {
  const next = title?.trim() ?? ''
  return next || '活动宣传'
}

/**
 * 运营在网页后台填写的 linkUrl。不读取 miniPath。
 * `/` 回首页；`/?city={slug}` 去找店；http(s) 外链；其他站内路径提示无法打开。
 * javascript:、data: 和无协议的值保留图片但不可点。
 */
export function classifyMiniBannerLink(linkUrl: string): MiniBannerAction {
  const href = linkUrl.trim()
  if (!href) return { kind: 'ignore' }
  const lower = href.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) return { kind: 'ignore' }
  if (/^https?:\/\//i.test(href)) return { kind: 'external', href }
  if (!href.startsWith('/') || href.startsWith('//') || href.includes('\\')) return { kind: 'ignore' }

  const hashIndex = href.indexOf('#')
  const bare = hashIndex >= 0 ? href.slice(0, hashIndex) : href
  const queryIndex = bare.indexOf('?')
  const pathname = queryIndex >= 0 ? bare.slice(0, queryIndex) : bare
  const query = queryIndex >= 0 ? bare.slice(queryIndex + 1) : ''
  if (pathname !== '/') return { kind: 'toast' }
  if (!query) return { kind: 'home' }

  const slug = singleQuery(query, 'city')
  if (slug) return { kind: 'list', slug }
  return { kind: 'toast' }
}

function singleQuery(query: string, name: string): string | null {
  let found = ''
  let count = 0
  let extra = false
  for (const part of query.split('&')) {
    if (!part) continue
    const eq = part.indexOf('=')
    const key = decodeURIComponent(eq >= 0 ? part.slice(0, eq) : part)
    const value = decodeURIComponent((eq >= 0 ? part.slice(eq + 1) : '').replace(/\+/g, ' ')).trim()
    if (key !== name) {
      extra = true
      continue
    }
    count += 1
    found = value
  }
  if (extra || count !== 1 || !found) return null
  return found
}
