import { PHONE_REQUIRED_MESSAGE } from '../config'

export type HttpMode = 'public' | 'tourist' | 'wechat'

export interface TokenChoice {
  token: string
  stored: boolean
}

/** 公开请求不带令牌。游客请求只用已落库的 nj_mp_token。未打通的内存令牌不能拿来拉我的意向。 */
export function selectToken(mode: HttpMode, stored: string | null, memory: string | null): TokenChoice | null {
  if (mode === 'public') return null
  const storedToken = stored?.trim() ?? ''
  const memoryToken = memory?.trim() ?? ''
  if (mode === 'tourist') return storedToken ? { token: storedToken, stored: true } : null
  if (storedToken) return { token: storedToken, stored: true }
  if (memoryToken) return { token: memoryToken, stored: false }
  return null
}

export type AuthFailureAction = 'none' | 'clear-stored' | 'drop-memory'

/**
 * 公开接口的 401 不清令牌。
 * 「未登录」才清掉这次用过的令牌。
 * 密码错误和微信 code 失效留在当前表单。
 */
export function authFailureAction(input: {
  mode: HttpMode
  httpStatus: number
  code: number
  message: string
  usedStoredToken: boolean
}): AuthFailureAction {
  const is401 = input.httpStatus === 401 || input.code === 401
  if (!is401 || input.mode === 'public') return 'none'
  if (input.message === '手机号或密码错误') return 'none'
  if (input.message === '微信登录已失效，请重试') return 'none'
  if (input.message !== '未登录') return 'none'
  return input.usedStoredToken ? 'clear-stored' : 'drop-memory'
}

export interface AuthHold {
  stored: string | null
  memory: string | null
  writeStored: boolean
  deleteStored: boolean
}

/** 登录成功：只有 accountLinked 才写入本地。未打通不覆盖、不写入 nj_mp_token。 */
export function holdAfterLogin(accountLinked: boolean, token: string, previousStored: string | null): AuthHold {
  const next = token.trim()
  if (accountLinked && next) {
    return { stored: next, memory: null, writeStored: true, deleteStored: false }
  }
  return { stored: previousStored, memory: next || null, writeStored: false, deleteStored: false }
}

/** 绑定成功必须换新 token。未打通仍不写入，并丢掉已作废的本地令牌。 */
export function holdAfterBind(accountLinked: boolean, token: string): AuthHold {
  const next = token.trim()
  if (accountLinked && next) {
    return { stored: next, memory: null, writeStored: true, deleteStored: false }
  }
  return { stored: null, memory: next || null, writeStored: false, deleteStored: true }
}

export function holdAfterUnbind(): AuthHold {
  return { stored: null, memory: null, writeStored: false, deleteStored: true }
}

export function canLoadMyIntents(storedToken: string | null, accountLinked: boolean): boolean {
  return Boolean(storedToken?.trim()) && accountLinked
}

export function intentPostBlock(accountLinked: boolean, phone: string | null): string | null {
  if (accountLinked && phone?.trim()) return null
  return PHONE_REQUIRED_MESSAGE
}

export interface PhoneCodeBindBody {
  phoneCode: string
  password?: string
}

export interface PasswordBindBody {
  phone: string
  password: string
}

export function buildPhoneCodeBind(
  phoneCode: string,
  password: string,
): { ok: true; body: PhoneCodeBindBody } | { ok: false; message: string } {
  const code = phoneCode.trim()
  if (!code || code.length > 128) return { ok: false, message: '请使用微信手机号授权' }
  if (password && (password.length < 6 || password.length > 64)) {
    return { ok: false, message: '密码长度需为 6 到 64 位' }
  }
  return { ok: true, body: password ? { phoneCode: code, password } : { phoneCode: code } }
}

export function buildPasswordBind(
  phone: string,
  password: string,
): { ok: true; body: PasswordBindBody } | { ok: false; message: string } {
  const next = phone.trim()
  if (!/^1\d{10}$/.test(next)) return { ok: false, message: '请输入 11 位手机号' }
  if (!password) return { ok: false, message: '请输入密码' }
  if (password.length < 6 || password.length > 64) return { ok: false, message: '密码长度需为 6 到 64 位' }
  return { ok: true, body: { phone: next, password } }
}

export function resolveApiBase(override: string | null | undefined, fallback: string): string {
  const value = override?.trim() ?? ''
  if (/^https?:\/\/.+/i.test(value)) return value.replace(/\/+$/, '')
  return fallback
}

export function isWebviewEnabled(flag: string | null | undefined): boolean {
  return flag === '1'
}
