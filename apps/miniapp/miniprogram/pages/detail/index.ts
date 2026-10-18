import { errorMessage, statusOf } from '../../api/errors'
import { goLogin } from '../../api/navigate'
import { callPhone, readStoredToken } from '../../api/session'
import { fetchStore } from '../../api/services'
import { LISTING_GONE_MESSAGE, LISTING_MISSING_MESSAGE } from '../../config'
import { canSubmitIntent, priceLabel, shareImageUrl, storeSharePath, visitorTags } from '../../domain/stores'
import { ensureSite } from '../../ui/site'
import type { StorePackageItem } from '../../api/readers'

Page({
  data: {
    loading: true,
    brandColor: '#4BA3D9',
    onBrand: '#1A1A1A',
    storeId: 0,
    name: '',
    regionName: '',
    address: '',
    phone: '',
    price: '',
    packageText: '',
    packages: [] as StorePackageItem[],
    facilities: '',
    features: '',
    notice: '',
    trafficText: '',
    gallery: [] as string[],
    coverUrl: '',
    tags: [] as string[],
    canSubmit: false,
    error: '',
    canRetry: false,
    missing: false,
  },

  onLoad(query: Record<string, string | undefined>) {
    const storeId = Number(query.id || '')
    this.setData({ storeId: Number.isFinite(storeId) ? storeId : 0 })
    void this.load()
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const imageUrl = shareImageUrl(this.data.coverUrl || this.data.gallery[0])
    return {
      title: this.data.name || '苏中农家乐',
      path: storeSharePath(this.data.storeId),
      ...(imageUrl ? { imageUrl } : {}),
    }
  },

  onRetry() {
    void this.load()
  },

  onIntent() {
    if (!this.data.canSubmit || !this.data.storeId) return
    const target = `/pages/intent/form?listingId=${this.data.storeId}`
    if (!readStoredToken()) {
      goLogin(target)
      return
    }
    wx.navigateTo({ url: target })
  },

  onCallStore() {
    callPhone(this.data.phone)
  },

  async load() {
    if (!this.data.storeId) {
      this.setData({ loading: false, missing: true, error: LISTING_MISSING_MESSAGE, canRetry: false, canSubmit: false })
      return
    }
    this.setData({ loading: true, error: '', missing: false })
    try {
      const site = await ensureSite()
      const store = await fetchStore(String(this.data.storeId))
      const gallery = store.gallery.length ? store.gallery : store.coverUrl ? [store.coverUrl] : []
      const unavailable = !canSubmitIntent(store.shelfStatus, false)
      this.setData({
        loading: false,
        brandColor: site.brandColor,
        onBrand: site.onBrand,
        name: store.name,
        regionName: store.regionName,
        address: store.address,
        phone: store.phone,
        price: priceLabel(store.priceText, store.priceFrom),
        packageText: store.packageText,
        packages: store.packages,
        facilities: store.facilities,
        features: store.features,
        notice: store.notice,
        trafficText: store.trafficText,
        gallery,
        coverUrl: store.coverUrl,
        tags: visitorTags(store),
        canSubmit: !unavailable,
        error: '',
        canRetry: false,
        missing: false,
      })
      if (store.name) wx.setNavigationBarTitle({ title: store.name })
    } catch (error) {
      const status = statusOf(error)
      const missing = status === 404
      const gone = status === 410
      this.setData({
        loading: false,
        canSubmit: false,
        missing: missing || gone,
        canRetry: !missing && !gone,
        error: missing ? LISTING_MISSING_MESSAGE : gone ? LISTING_GONE_MESSAGE : errorMessage(error, '加载失败，请重试'),
      })
    }
  },
})
