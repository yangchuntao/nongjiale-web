import { errorMessage } from '../../api/errors'
import { wechatBind, wechatLogin } from '../../api/services'
import {
  applyHold,
  leaveLogin,
  readMemoryToken,
  readStoredToken,
  setLoginRedirect,
  toast,
} from '../../api/session'
import { buildPasswordBind, buildPhoneCodeBind, holdAfterBind, holdAfterLogin } from '../../domain/session'
import { ensureSite } from '../../ui/site'
import type { PasswordBindBody, PhoneCodeBindBody } from '../../domain/session'

function loginCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) resolve(res.code)
        else reject(new Error('需要授权后才能提交意向'))
      },
      fail: () => {
        reject(new Error('需要授权后才能提交意向'))
      },
    })
  })
}

Page({
  data: {
    step: 'wechat' as 'wechat' | 'bind',
    submitting: false,
    phone: '',
    password: '',
    error: '',
    siteName: '站点名称',
    brandColor: '#4BA3D9',
    onBrand: '#1A1A1A',
  },

  onLoad(query: Record<string, string | undefined>) {
    const redirect = query.redirect ? decodeURIComponent(query.redirect) : ''
    if (redirect.startsWith('/pages/')) setLoginRedirect(redirect)
    if (readStoredToken()) {
      leaveLogin()
      return
    }
    if (readMemoryToken()) this.setData({ step: 'bind' })
    void this.loadSite()
  },

  async loadSite() {
    const site = await ensureSite()
    this.setData({ siteName: site.siteName, brandColor: site.brandColor, onBrand: site.onBrand })
    wx.setNavigationBarTitle({ title: site.siteName })
  },

  onPhone(event: WechatMiniprogram.Input) {
    this.setData({ phone: event.detail.value })
  },

  onPassword(event: WechatMiniprogram.Input) {
    this.setData({ password: event.detail.value })
  },

  onSkip() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/home/index' })
      },
    })
  },

  async onWechatLogin() {
    if (this.data.submitting) return
    this.setData({ submitting: true, error: '' })
    try {
      const code = await loginCode()
      const session = await wechatLogin(code)
      applyHold(holdAfterLogin(session.accountLinked, session.token, readStoredToken()))
      if (!session.accountLinked) {
        this.setData({ step: 'bind', submitting: false })
        return
      }
      toast('登录成功')
      leaveLogin()
    } catch (error) {
      this.setData({ submitting: false, error: errorMessage(error, '需要授权后才能提交意向') })
    }
  },

  onGetPhone(event: WechatMiniprogram.ButtonGetPhoneNumber) {
    const code = event.detail.code ?? ''
    if (!code) {
      toast('需要授权后才能提交意向')
      return
    }
    const built = buildPhoneCodeBind(code, this.data.password)
    if (!built.ok) {
      this.setData({ error: built.message })
      return
    }
    void this.bind(built.body)
  },

  onPasswordBind() {
    const built = buildPasswordBind(this.data.phone, this.data.password)
    if (!built.ok) {
      this.setData({ error: built.message })
      return
    }
    void this.bind(built.body)
  },

  async bind(body: PhoneCodeBindBody | PasswordBindBody) {
    if (this.data.submitting) return
    this.setData({ submitting: true, error: '' })
    try {
      const session = await wechatBind(body)
      applyHold(holdAfterBind(session.accountLinked, session.token))
      if (!session.accountLinked) {
        this.setData({ submitting: false, step: 'bind' })
        return
      }
      toast('登录成功')
      leaveLogin()
    } catch (error) {
      this.setData({ submitting: false, error: errorMessage(error, '加载失败，请重试') })
    }
  },
})
