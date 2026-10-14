export const INTENT_STATUS_LABEL: Record<string, string> = {
  PENDING: '待跟进',
  CONFIRMED: '已确认',
  RESCHEDULED: '已改期',
  CLOSED: '已关闭',
}

export const STORE_STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  ON_SALE: '已上架',
  OFF_SALE: '已下架',
}

export const LISTING_STATE_LABEL: Record<string, string> = {
  NONE: '无进行中的申请',
  PUBLISH_PENDING: '上架待审',
  UNPUBLISH_PENDING: '下架待审',
}

export const REVIEW_STATUS_LABEL: Record<string, string> = {
  PENDING: '待审',
  APPROVED: '已通过',
  REJECTED: '已驳回',
}

export const LISTING_ACTION_LABEL: Record<string, string> = {
  PUBLISH: '上架',
  UNPUBLISH: '下架',
}

export const ARTICLE_STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
}

export function labelOf(dict: Record<string, string>, value?: string | null, fallback = '—') {
  if (value == null || value === '') return fallback
  return dict[value] ?? value
}
