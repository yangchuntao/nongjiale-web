import { errorMessage } from '../../api/errors'
import { callPhone, copyText, readStoredToken } from '../../api/session'
import { fetchMyIntent } from '../../api/services'
import { intentSuccessCopy } from '../../domain/copy'
import { ensureSite } from '../../ui/site'

Page({
  data: {
    loading: true,
    brandColor: '#4BA3D9',
    onBrand: '#1A1A1A',
    intentId: '',
    intentNo: '',
    storeName: '',
    checkIn: '',
    guests: '',
    contactPhone: '',
    notice: '',
    hint: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      intentId: query.id || '',
      intentNo: query.intentNo ? decodeURIComponent(query.intentNo) : '',
    })
    void this.load()
  },

  async load() {
    if (!readStoredToken()) {
      this.setData({ loading: false, hint: '提交结果获取失败，请到我的意向查看' })
      return
    }
    const site = await ensureSite()
    const notice = intentSuccessCopy(this.data.intentNo, site.contactPhone)
    this.setData({
      brandColor: site.brandColor,
      onBrand: site.onBrand,
      contactPhone: site.contactPhone,
      notice,
    })
    if (!this.data.intentId) {
      this.setData({ loading: false, hint: this.data.intentNo ? '' : '提交结果获取失败，请到我的意向查看' })
      return
    }
    try {
      const intent = await fetchMyIntent(this.data.intentId)
      const intentNo = intent.intentNo || this.data.intentNo
      this.setData({
        loading: false,
        intentNo,
        storeName: intent.storeName,
        checkIn: intent.checkIn,
        guests: intent.guests ? String(intent.guests) : '',
        notice: intentSuccessCopy(intentNo, site.contactPhone),
        hint: '',
      })
    } catch (error) {
      this.setData({
        loading: false,
        hint: this.data.intentNo ? errorMessage(error, '提交结果获取失败，请到我的意向查看') : '提交结果获取失败，请到我的意向查看',
      })
    }
  },

  onCopy() {
    if (!this.data.intentNo) return
    copyText(this.data.intentNo, '已复制单号')
  },

  onCall() {
    callPhone(this.data.contactPhone)
  },

  onMine() {
    wx.switchTab({ url: '/pages/my/intents' })
  },

  onHome() {
    wx.switchTab({ url: '/pages/home/index' })
  },
})
