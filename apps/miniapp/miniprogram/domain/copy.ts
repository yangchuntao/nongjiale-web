/**
 * CHECKED_IN 对客只显示「已入住」。
 * 禁词只用于识别后改写，不作为状态标签展示。
 */
export const INTENT_STATUS_LABEL = {
  PENDING: '待跟进',
  CONFIRMED: '已确认',
  RESCHEDULED: '已改期',
  CHECKED_IN: '已入住',
  CLOSED: '已关闭',
} as const

export const FORBIDDEN_INTENT_LABELS = ['已订立', '已落实', '已落地', '已成交', '已达成', '已定着'] as const

const CHECKED_IN = '已入住'

export function intentStatusLabel(status: string, statusLabel?: string | null): string {
  const label = statusLabel?.trim() ?? ''
  if (status === 'CHECKED_IN' || isForbidden(status) || isForbidden(label)) return CHECKED_IN
  if (label && !isForbidden(label)) return label
  if (status in INTENT_STATUS_LABEL) return INTENT_STATUS_LABEL[status as keyof typeof INTENT_STATUS_LABEL]
  return status || '未知状态'
}

export function normalizeIntentCopy(text: string): string {
  let next = text
  for (const word of FORBIDDEN_INTENT_LABELS) next = next.split(word).join(CHECKED_IN)
  return next
}

function isForbidden(value: string): boolean {
  return (FORBIDDEN_INTENT_LABELS as readonly string[]).includes(value)
}

export const INTENT_FORM_NOTICE = '提交意向后，客服会联系您确认。意向不等于已锁房。'

export const INTENT_FORM_FOOT = '提交后客服会电话联系您确认档期与接待安排。提交意向不等于已锁房。'

export const INTENT_LIST_NOTICE = '以下为咨询意向，未锁房，以客服确认为准。'

export const INTENT_DETAIL_NOTICE = '未锁房，以客服确认为准。'

export const DETAIL_UNLOCK_NOTICE = '意向不等于已锁房'

export const DETAIL_CTA_HINT = '客服确认后安排，非即时订成'

export function intentSuccessCopy(intentNo: string, phone: string): string {
  return `意向单号：${intentNo}。客服电话：${phone}。我们会尽快联系您确认。意向不等于已锁房，请勿理解为已订成或已支付。请等待确认，当前未锁房。`
}
