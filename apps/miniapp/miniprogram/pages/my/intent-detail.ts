import { errorMessage, statusOf } from '../../api/errors'
import { replaceLogin } from '../../api/navigate'
import { callPhone, readStoredToken } from '../../api/session'
import { fetchMyIntent } from '../../api/services'
import { INTENT_MISSING_MESSAGE } from '../../config'
import { intentStatusLabel } from '../../domain/copy'
import { ensureSite } from '../../ui/site'

Page({
  data: {
    loading: true,
    brandColor: '#4BA3D9',
    onBrand: '#1A1A1A',
    intentId: '',
    intentNo: '',
    statusText: '',
    storeName: '',
    checkIn: '',
    checkOut: '',
    nights: '',
    guests: '',
    contactName: '',
    contactPhone: '',
    userRemark: '',
    createdAt: '',
    servicePhone: '',
    error: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({ intentId: query.id || '' })
  },

  onShow() {
    if (!readStoredToken()) {
      replaceLogin(`/pages/my/intent-detail?id=${this.data.intentId}`)
      return
    }
    void this.load()
  },

  onRetry() {
    void this.load()
  },

  onBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/my/intents' })
      },
    })
  },

  onCall() {
    callPhone(this.data.servicePhone)
  },

  async load() {
    if (!this.data.intentId) {
      this.setData({ loading: false, error: INTENT_MISSING_MESSAGE })
      return
    }
    this.setData({ loading: true, error: '' })
    try {
      const site = await ensureSite()
      const intent = await fetchMyIntent(this.data.intentId)
      this.setData({
        loading: false,
        brandColor: site.brandColor,
        onBrand: site.onBrand,
        servicePhone: site.contactPhone,
        intentNo: intent.intentNo,
        statusText: intentStatusLabel(intent.status),
        storeName: intent.storeName,
        checkIn: intent.checkIn,
        checkOut: intent.checkOut,
        nights: intent.nights ? String(intent.nights) : '',
        guests: intent.guests ? String(intent.guests) : '',
        contactName: intent.contactName,
        contactPhone: intent.contactPhone,
        userRemark: intent.userRemark,
        createdAt: intent.createdAt,
      })
    } catch (error) {
      const status = statusOf(error)
      this.setData({
        loading: false,
        error: status === 404 ? INTENT_MISSING_MESSAGE : status === 403 ? '无权查看' : errorMessage(error, '加载失败，请重试'),
      })
    }
  },
})
