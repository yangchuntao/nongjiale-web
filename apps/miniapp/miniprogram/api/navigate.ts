import { CLOSED_DESTINATION_HINT } from '../config'
import { classifyMiniBannerLink } from '../domain/banners'
import { findOpenCityBySlug, type RegionItem } from '../domain/regions'
import { copyText, readWebviewEnabled, setListHandoff, setLoginRedirect, toast } from './session'

export function openBannerLink(linkUrl: string, regions: readonly RegionItem[] | null): void {
  const action = classifyMiniBannerLink(linkUrl)
  if (action.kind === 'ignore') return
  if (action.kind === 'toast') {
    toast('暂无法在小程序内打开')
    return
  }
  if (action.kind === 'home') {
    wx.switchTab({ url: '/pages/home/index' })
    return
  }
  if (action.kind === 'list') {
    if (!regions) {
      toast('加载异常')
      return
    }
    const city = findOpenCityBySlug(regions, action.slug)
    if (!city) {
      toast(CLOSED_DESTINATION_HINT)
      return
    }
    setListHandoff({ regionId: city.id, keyword: '' })
    wx.switchTab({ url: '/pages/list/index' })
    return
  }
  if (!readWebviewEnabled()) {
    wx.showModal({
      title: '复制链接',
      content: action.href,
      confirmText: '复制链接',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) copyText(action.href, '已复制，请到浏览器粘贴打开')
      },
    })
    return
  }
  wx.navigateTo({ url: `/pages/webview/index?url=${encodeURIComponent(action.href)}` })
}

export function goLogin(redirect: string): void {
  setLoginRedirect(redirect)
  wx.navigateTo({ url: '/pages/login/index' })
}

export function replaceLogin(redirect: string): void {
  setLoginRedirect(redirect)
  wx.redirectTo({ url: '/pages/login/index' })
}
