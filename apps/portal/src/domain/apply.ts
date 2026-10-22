import { PHONE_PATTERN } from './intent'

export interface MerchantApplyDraft {
  subjectName: string
  contactName: string
  contactPhone: string
  storeName: string
  regionId: string
  remark: string
}

export type ApplyErrors = Partial<Record<keyof MerchantApplyDraft, string>>

/** 后端 POST /api/merchant-applies 的请求体（字段名与 MerchantApplyRequest 对齐）。 */
export interface MerchantApplyBody {
  orgName: string
  contactName: string
  contactPhone: string
  plannedStoreName: string
  regionId: number
  description?: string
}

export function validateMerchantApply(draft: MerchantApplyDraft): ApplyErrors {
  const errors: ApplyErrors = {}
  if (!draft.subjectName.trim()) errors.subjectName = '请填写主体名称'
  else if (draft.subjectName.trim().length > 64) errors.subjectName = '主体名称过长'
  if (!draft.contactName.trim()) errors.contactName = '请填写联系人'
  if (!PHONE_PATTERN.test(draft.contactPhone.trim())) errors.contactPhone = '请输入 11 位手机号'
  if (!draft.storeName.trim()) errors.storeName = '请填写拟营门店名'
  if (!draft.regionId.trim() || Number.isNaN(Number(draft.regionId))) errors.regionId = '请选择地区'
  if (draft.remark.trim().length > 500) errors.remark = '说明过长'
  return errors
}

export function buildMerchantApplyBody(draft: MerchantApplyDraft): {
  errors: ApplyErrors
  body: MerchantApplyBody | null
} {
  const errors = validateMerchantApply(draft)
  if (Object.keys(errors).length > 0) return { errors, body: null }
  const remark = draft.remark.trim()
  // 后端 DTO 字段名：orgName / plannedStoreName / description（未知字段会被 400 拒绝）
  const body: MerchantApplyBody = {
    orgName: draft.subjectName.trim(),
    contactName: draft.contactName.trim(),
    contactPhone: draft.contactPhone.trim(),
    plannedStoreName: draft.storeName.trim(),
    regionId: Number(draft.regionId),
  }
  if (remark) body.description = remark
  return { errors, body }
}
