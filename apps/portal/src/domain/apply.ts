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

export interface MerchantApplyBody {
  subjectName: string
  contactName: string
  contactPhone: string
  storeName: string
  regionId: number
  remark?: string
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
  const body: MerchantApplyBody = {
    subjectName: draft.subjectName.trim(),
    contactName: draft.contactName.trim(),
    contactPhone: draft.contactPhone.trim(),
    storeName: draft.storeName.trim(),
    regionId: Number(draft.regionId),
  }
  if (remark) body.remark = remark
  return { errors, body }
}
