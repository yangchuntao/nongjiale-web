import { errorMessage, isUnauthorized } from '../../api/errors'
import { goLogin } from '../../api/navigate'
import {
  applyHold,
  callPhone,
  clearStoredToken,
  readStoredToken,
  toast,
} from '../../api/session'
import { fetchMe, fetchMyIntents, fetchWechatLink, wechatUnbind } from '../../api/services'
import { UNLINKED_BANNER } from '../../config'
import { intentStatusLabel } from '../../domain/copy'
import { canLoadMyIntents, holdAfterBind, holdAfterUnbind } from '../../domain/session'
import { ensureSite } from '../../ui/site'

interface IntentView {
  id: number
  intentNo: string
  storeName: string
  checkIn: string
  guests: string
  statusText: string
}

Page({
  data: {
    phase: 'wall' as 'wall' | 'unlinked' | 'loading' | 'error' | 'ready',
    brandColor: '#4BA3D9',
    onBrand: '#1A1A1A',
    contactPhone: '',
    phone: '',
    items: [] as IntentView[],
    banner: UNLINKED_BANNER,
  },

  onShow() {
    void this.load()
  },

  onPullDownRefresh() {
    void this.load().finally(() => wx.stopPullDownRefresh())
  },

  onLogin() {
    goLogin('/pages/my/intents')
  },

  onFind() {
    wx.switchTab({ url: '/pages/list/index' })
  },

  onOpen(event: WechatMiniprogram.BaseEvent) {
    const id = Number(event.currentTarget.dataset.id)
    if (!Number.isFinite(id)) return
    wx.navigateTo({ url: `/pages/my/intent-detail?id=${id}` })
  },

  onCall() {
    callPhone(this.data.contactPhone)
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '只清除本机登录状态，不解除微信绑定。下次微信一键登录仍会进入当前账号。',
      success: (res) => {
        if (!res.confirm) return
        clearStoredToken()
        this.setData({ phase: 'wall', items: [], phone: '' })
      },
    })
  },

  onUnbind() {
    wx.showModal({
      title: '解除微信绑定',
      content: '解绑后本机会退出。再次微信登录会进入新的未打通账号，直到用手机号重新绑定。网页版账号和已有意向仍留在网页版。',
      success: (res) => {
        if (!res.confirm) return
        void this.unbind()
      },
    })
  },

  onRetry() {
    void this.load()
  },

  async unbind() {
    try {
      await wechatUnbind()
      applyHold(holdAfterUnbind())
      this.setData({ phase: 'wall', items: [], phone: '' })
    } catch (error) {
      toast(errorMessage(error, '加载失败，请重试'))
    }
  },

  async load() {
    const stored = readStoredToken()
    if (!stored) {
      this.setData({ phase: 'wall', items: [], phone: '' })
      return
    }
    this.setData({ phase: 'loading' })
    try {
      const site = await ensureSite()
      const link = await fetchWechatLink()
      if (!canLoadMyIntents(readStoredToken(), link.accountLinked)) {
        applyHold(holdAfterBind(false, stored))
        this.setData({
          phase: 'unlinked',
          items: [],
          phone: '',
          brandColor: site.brandColor,
          onBrand: site.onBrand,
          contactPhone: site.contactPhone,
        })
        return
      }
      const page = await fetchMyIntents(1)
      let phone = link.phone || ''
      try {
        const me = await fetchMe()
        phone = me.phone || phone
      } catch {
        phone = link.phone || ''
      }
      const items: IntentView[] = page.items.map((item) => ({
        id: item.id,
        intentNo: item.intentNo,
        storeName: item.storeName,
        checkIn: item.checkIn,
        guests: item.guests ? String(item.guests) : '',
        statusText: intentStatusLabel(item.status),
      }))
      this.setData({
        phase: 'ready',
        items,
        phone,
        brandColor: site.brandColor,
        onBrand: site.onBrand,
        contactPhone: site.contactPhone,
      })
    } catch (error) {
      if (isUnauthorized(error)) {
        this.setData({ phase: 'wall', items: [], phone: '' })
        return
      }
      this.setData({ phase: 'error' })
    }
  },
})
