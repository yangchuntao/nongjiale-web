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
 * 禁止把终态写成「已成交」或「已达成」。
 */
export const INTENT_STATUS_LABEL = {
  PENDING: '待跟进',
  CONFIRMED: '已确认',
  RESCHEDULED: '已改期',
  CHECKED_IN: '已入住',
  CLOSED: '已关闭',
} as const satisfies Record<IntentStatus, string>

type Assert<T extends true> = T
type IntentLabel = (typeof INTENT_STATUS_LABEL)[keyof typeof INTENT_STATUS_LABEL]

/** 编译期锁定：意向文案不得使用禁用终态用词。 */
export type IntentStatusLabelsLocked = Assert<IntentLabel extends '已成交' | '已达成' ? false : true>

/** 只读说明合法迁移。前端不自创状态迁移。 */
export const INTENT_STATUS_TRANSITIONS: Record<IntentStatus, readonly IntentStatus[]> = {
  PENDING: ['CONFIRMED', 'RESCHEDULED', 'CLOSED'],
  CONFIRMED: ['CHECKED_IN', 'CLOSED'],
  RESCHEDULED: ['CONFIRMED', 'CLOSED'],
  CHECKED_IN: [],
  CLOSED: [],
}
