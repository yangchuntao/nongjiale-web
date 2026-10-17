export const INTENT_NOTICE = '提交意向后客服将联系确认。意向不等于已锁房。'

export const LISTINGS_LEAD = '按地区、特色和价格缩小范围。以下为可提交意向的农家乐。'

export const DESTINATION_PENDING = '目的地筹备中，先去找农家乐'

export const DESTINATION_CLOSED_BODY = '我们还在筹备这一站，先看看已经开通的目的地吧。'

export const DESTINATION_OPEN_EMPTY = '暂时还没有可提交意向的农家乐，试试其他目的地'

export const INTENT_FORM_NOTICE = '提交后客服会电话联系您确认档期与接待安排。提交意向不等于已锁房。'

export const INTENT_LIST_NOTICE = '以下为咨询意向，未锁房，以客服确认为准。'

export function intentSuccessCopy(intentNo: string, phone: string): string {
  return `意向单号：${intentNo}。客服电话：${phone}。我们会尽快联系您确认。意向不等于已锁房，请勿理解为已订成或已支付。`
}

export function welcomeTitle(siteName: string): string {
  return `欢迎来到${siteName}`
}
