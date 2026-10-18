import type { MiniApp } from '../app'
import { BRAND } from '../config'
import { normalizeHex, onBrandText } from '../domain/brand'

export interface SiteView {
  siteName: string
  brandColor: string
  onBrand: string
  contactPhone: string
}

export async function ensureSite(): Promise<SiteView> {
  const app = getApp<MiniApp>()
  if (app.loadSite) await app.loadSite()
  const brandColor = normalizeHex(app.globalData.brandColor) ?? BRAND
  return {
    siteName: app.globalData.siteName || '站点名称',
    brandColor,
    onBrand: onBrandText(brandColor),
    contactPhone: app.globalData.contactPhone || '',
  }
}

export function currentSite(): SiteView {
  const app = getApp<MiniApp>()
  const brandColor = normalizeHex(app.globalData?.brandColor) ?? BRAND
  return {
    siteName: app.globalData?.siteName || '站点名称',
    brandColor,
    onBrand: onBrandText(brandColor),
    contactPhone: app.globalData?.contactPhone || '',
  }
}
