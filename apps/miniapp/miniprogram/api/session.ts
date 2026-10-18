import {
  API_BASE_STORAGE_KEY,
  DEFAULT_API_BASE,
  MP_TOKEN_KEY,
  WEBVIEW_READY_KEY,
} from '../config'
import type { AuthHold } from '../domain/session'
import { isWebviewEnabled, resolveApiBase } from '../domain/session'

let memoryToken: string | null = null
let loginRedirect = ''

export interface ListHandoff {
  regionId: number | null
  keyword: string
}

let listHandoff: ListHandoff | null = null

function storageText(key: string): string {
  try {
    const value = wx.getStorageSync(key) as unknown
    return typeof value === 'string' ? value.trim() : ''
  } catch {
    return ''
  }
}

export function readStoredToken(): string | null {
  const value = storageText(MP_TOKEN_KEY)
  return value || null
}

export function readMemoryToken(): string | null {
  const value = memoryToken?.trim() ?? ''
  return value || null
}

export function readApiBase(): string {
  return resolveApiBase(storageText(API_BASE_STORAGE_KEY), DEFAULT_API_BASE)
}

export function readWebviewEnabled(): boolean {
  return isWebviewEnabled(storageText(WEBVIEW_READY_KEY))
}

export function applyHold(hold: AuthHold): void {
  memoryToken = hold.memory
  if (hold.writeStored && hold.stored) {
    wx.setStorageSync(MP_TOKEN_KEY, hold.stored)
    return
  }
  if (hold.deleteStored) wx.removeStorageSync(MP_TOKEN_KEY)
}

export function clearStoredToken(): void {
  memoryToken = null
  try {
    wx.removeStorageSync(MP_TOKEN_KEY)
  } catch {
    // 存储不可用时内存令牌已经丢掉。
  }
}

export function dropMemoryToken(): void {
  memoryToken = null
}

export function setLoginRedirect(url: string): void {
  loginRedirect = url
}

export function consumeLoginRedirect(): string {
  const value = loginRedirect
  loginRedirect = ''
  return value
}

export function setListHandoff(next: ListHandoff): void {
  listHandoff = next
}

export function consumeListHandoff(): ListHandoff | null {
  const value = listHandoff
  listHandoff = null
  return value
}

export function openLogin(): void {
  const pages = getCurrentPages()
  const route = pages[pages.length - 1]?.route ?? ''
  if (route === 'pages/login/index') return
  wx.navigateTo({
    url: '/pages/login/index',
    fail: () => {
      wx.redirectTo({ url: '/pages/login/index' })
    },
  })
}

const TAB_PAGES = new Set(['/pages/home/index', '/pages/list/index', '/pages/my/intents'])

export function leaveLogin(): void {
  const target = consumeLoginRedirect()
  const path = target.split('?')[0] ?? ''
  if (TAB_PAGES.has(path)) {
    wx.switchTab({ url: path })
    return
  }
  if (target.startsWith('/pages/')) {
    wx.redirectTo({
      url: target,
      fail: () => {
        wx.switchTab({ url: '/pages/home/index' })
      },
    })
    return
  }
  wx.navigateBack({
    fail: () => {
      wx.switchTab({ url: '/pages/home/index' })
    },
  })
}

export function toast(title: string): void {
  wx.showToast({ title, icon: 'none' })
}

export function callPhone(phone: string): void {
  const value = phone.trim()
  if (!value) return
  wx.makePhoneCall({
    phoneNumber: value,
    fail: () => {
      toast('无法拨打电话')
    },
  })
}

export function copyText(value: string, success: string): void {
  wx.setClipboardData({
    data: value,
    success: () => {
      toast(success)
    },
  })
}
