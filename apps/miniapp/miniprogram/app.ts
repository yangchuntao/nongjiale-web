import { fetchPublicConfig } from './api/services'
import { BRAND } from './config'
import { normalizeHex } from './domain/brand'

export interface MiniApp {
  globalData: {
    siteName: string
    brandColor: string
    contactPhone: string
  }
  loadSite: () => Promise<void>
}

App<MiniApp>({
  globalData: {
    siteName: '站点名称',
    brandColor: BRAND,
    contactPhone: '',
  },

  onLaunch() {
    void this.loadSite()
  },

  async loadSite() {
    try {
      const config = await fetchPublicConfig()
      if (config.siteName) this.globalData.siteName = config.siteName
      if (config.contactPhone) this.globalData.contactPhone = config.contactPhone
      const color = normalizeHex(config.brandColor)
      if (color) this.globalData.brandColor = color
    } catch {
      // 公开配置失败时保留默认站名和主色，不进入登录页。
    }
  },
})
