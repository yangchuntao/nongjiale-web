export const MERCHANT_INTENT_NOTICE = '意向由平台客服跟进。意向不等于已锁房。'

export const STORE_SAVED = '已保存；游客是否可见取决于上架状态'

export const SHELF_SUBMITTED = '已提交，等待运营审核；通过前游客可见性不变'

export const EMPTY_STORES = '暂无门店，请联系运营代为开通'

export const EMPTY_INTENTS = '暂无意向'

export const EMPTY_SHELF = '暂无上下架申请记录'

export const PHONE_PATTERN = /^1\d{10}$/

export function validatePassword(password: string): string {
  if (!password.trim()) return '请输入密码'
  if (password.length < 6 || password.length > 64) return '密码长度需为 6 到 64 位'
  return ''
}
