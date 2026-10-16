export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface PhonePasswordCredentials {
  phone: string
  password: string
}

export interface PublicSiteConfig {
  siteName: string
  primaryColor: string
  contactPhone: string
}

/** 意向状态英文码。展示中文以 INTENT_STATUS_LABEL 为准。 */
export const INTENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  RESCHEDULED: 'RESCHEDULED',
  CHECKED_IN: 'CHECKED_IN',
  CLOSED: 'CLOSED',
} as const

export type IntentStatus = (typeof INTENT_STATUS)[keyof typeof INTENT_STATUS]

/**
 * 对客/后台文案。终态中文锁定「已入住」，对应 CHECKED_IN。
 * 禁止把终态写成「已订立」「已落实」「已落地」「已成交」或「已达成」。
 */
export const INTENT_STATUS_LABEL = {
  PENDING: '待跟进',
  CONFIRMED: '已确认',
  RESCHEDULED: '已改期',
  CHECKED_IN: '已入住',
  CLOSED: '已关闭',
} as const satisfies Record<IntentStatus, string>

/** 接口或 CSV 若仍带回这些词，展示前归一成「已入住」。 */
export const FORBIDDEN_INTENT_LABELS = ['已订立', '已落实', '已落地', '已成交', '已达成'] as const

export type ForbiddenIntentLabel = (typeof FORBIDDEN_INTENT_LABELS)[number]

type Assert<T extends true> = T
type IntentLabel = (typeof INTENT_STATUS_LABEL)[keyof typeof INTENT_STATUS_LABEL]

/** 编译期锁定：任一终态文案命中禁用词则失败。 */
export type IntentStatusLabelsLocked = Assert<Extract<IntentLabel, ForbiddenIntentLabel> extends never ? true : false>

export function intentDisplayLabel(status: string, statusLabel?: string | null): string {
  const label = statusLabel?.trim() ?? ''
  if (
    status === INTENT_STATUS.CHECKED_IN ||
    isForbiddenIntentLabel(status) ||
    isForbiddenIntentLabel(label)
  ) {
    return INTENT_STATUS_LABEL.CHECKED_IN
  }
  if (label) return label
  if (status in INTENT_STATUS_LABEL) return INTENT_STATUS_LABEL[status as IntentStatus]
  return status || '未知状态'
}

export function normalizeIntentCopy(text: string): string {
  let next = text
  for (const word of FORBIDDEN_INTENT_LABELS) next = next.split(word).join(INTENT_STATUS_LABEL.CHECKED_IN)
  return next
}

function isForbiddenIntentLabel(value: string): value is ForbiddenIntentLabel {
  return (FORBIDDEN_INTENT_LABELS as readonly string[]).includes(value)
}

/** 只读说明合法迁移。前端不自创状态迁移。 */
export const INTENT_STATUS_TRANSITIONS: Record<IntentStatus, readonly IntentStatus[]> = {
  PENDING: ['CONFIRMED', 'RESCHEDULED', 'CLOSED'],
  CONFIRMED: ['CHECKED_IN', 'CLOSED'],
  RESCHEDULED: ['CONFIRMED', 'CLOSED'],
  CHECKED_IN: [],
  CLOSED: [],
}
