export interface IntentDraft {
  checkIn: string
  checkOut: string
  nights: string
  guests: string
  contactName: string
  contactPhone: string
  userRemark: string
}

export type IntentField = keyof IntentDraft

export type IntentErrors = Partial<Record<IntentField, string>>

export interface CreateIntentBody {
  storeId: number
  checkIn: string
  checkOut?: string
  nights?: number
  guests: number
  contactName: string
  contactPhone: string
  userRemark?: string
}

function nightsBetween(checkIn: string, checkOut: string): number | null {
  const start = Date.parse(`${checkIn}T00:00:00`)
  const end = Date.parse(`${checkOut}T00:00:00`)
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return Math.round((end - start) / 86_400_000)
}

export function validateIntent(draft: IntentDraft, today: string): IntentErrors {
  const errors: IntentErrors = {}
  const checkIn = draft.checkIn.trim()
  const checkOut = draft.checkOut.trim()
  const nightsText = draft.nights.trim()
  const name = draft.contactName.trim()
  const phone = draft.contactPhone.trim()
  const remark = draft.userRemark.trim()
  const guests = Number(draft.guests)

  if (!checkIn) errors.checkIn = '请填写到店日期'
  else if (checkIn < today) errors.checkIn = '到店日期不能早于今天'

  const nights = nightsText ? Number(nightsText) : null
  if (nightsText && (!Number.isInteger(nights) || (nights ?? 0) < 1)) errors.nights = '晚数不正确'
  if (!checkOut && !nightsText) errors.checkOut = '请填写离店日期或晚数'
  if (checkOut && checkIn && checkOut <= checkIn) errors.checkOut = '离店日期须晚于到店日期'
  if (checkOut && checkIn && nightsText && !errors.nights && !errors.checkOut) {
    const span = nightsBetween(checkIn, checkOut)
    if (span !== nights) errors.nights = '离店日期与晚数不一致'
  }

  if (!Number.isInteger(guests) || guests < 1) errors.guests = '请填写人数'
  if (!name) errors.contactName = '请填写联系人'
  else if (name.length > 64) errors.contactName = '联系人过长'
  if (!/^1\d{10}$/.test(phone)) errors.contactPhone = '请输入 11 位手机号'
  if (remark.length > 500) errors.userRemark = '备注过长'
  return errors
}

export function buildCreateIntentBody(storeId: number, draft: IntentDraft, today: string): {
  errors: IntentErrors
  body: CreateIntentBody | null
} {
  const errors = validateIntent(draft, today)
  if (!Number.isFinite(storeId)) errors.checkIn = errors.checkIn ?? '请选择房源'
  if (Object.keys(errors).length > 0) return { errors, body: null }

  const checkIn = draft.checkIn.trim()
  const checkOut = draft.checkOut.trim()
  const nightsText = draft.nights.trim()
  const nights = checkOut ? nightsBetween(checkIn, checkOut) : Number(nightsText)
  const remark = draft.userRemark.trim()
  const body: CreateIntentBody = {
    storeId,
    checkIn,
    guests: Number(draft.guests),
    contactName: draft.contactName.trim(),
    contactPhone: draft.contactPhone.trim(),
  }
  if (checkOut) body.checkOut = checkOut
  if (nights && nights > 0) body.nights = nights
  if (remark) body.userRemark = remark
  return { errors, body }
}

export function todayIso(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const PHONE_PATTERN = /^1\d{10}$/

export function validatePassword(password: string): string {
  if (!password.trim()) return '请输入密码'
  if (password.length < 6 || password.length > 64) return '密码长度需为 6 到 64 位'
  return ''
}
