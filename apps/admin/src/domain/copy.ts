export const INTENT_OPERATOR_NOTICE = '对客沟通请强调意向未锁房、无在线支付。'

export const EXPORT_NOTICE = '导出供线下协议佣金对账；站内不计算佣金、无收款。'

export const RECOMMEND_HELP = '商家后台不可见本控件；无独立推荐位管理页。'

export const SORT_HELP = '数字越小越靠前'

export const SITE_PLACEHOLDER_HELP = '正式品牌值稍后由老板提供；未填时前端使用占位。'

export const SITE_PREVIEW_HELP = '门户将使用新配置。'

export const EMPTY_APPLIES = '暂无待审'

export const EMPTY_SHELF = '暂无待审申请'

export const EMPTY_INTENTS = '无匹配意向'

export const EMPTY_GUIDES = '暂无攻略'

export const EMPTY_MERCHANTS = '暂无商家'

export const EMPTY_LISTINGS = '暂无房源'

export const LISTING_SAVED = '已保存'

export const SHELF_EFFECTIVE = '已生效，游客可见性已更新'

export const PHONE_PATTERN = /^1\d{10}$/

export const CITY_UNIT_HINT = '开通单位为地级市；区县仅作门户筛选，不在此开城。'

export const CITY_LIST_EMPTY = '暂无目的地配置，请联系工程导入行政区划'

export const CITY_LIST_ERROR = '列表加载失败，请重试'

export const CITY_DETAIL_MISSING = '目的地不存在'

export const CITY_DETAIL_ERROR = '加载失败，请重试'

export const CITY_OPEN_SUCCESS = '该市已对客可见'

export const CITY_CLOSE_SUCCESS = '门户将不再展示该目的地'

export const CITY_NM_HINT = 'N、M 为站点配置，当前默认 5 / 1。本页不能修改 N、M。'

export const CHECKLIST_AUTO_HINT = '按实时计数自动勾选，不能手改'

export const SEED_NOTICE = '只读统计，供开城后观察种子转化。站内无收款；已入住为客服确认状态。'

export const SEED_EMPTY = '该时间窗暂无意向数据'

export const SEED_ERROR = '指标加载失败，请重试'

export function cityOpenConfirm(name: string): string {
  return `确认开通「${name}」？开通后游客可在首页与列表选择该目的地。`
}

export function cityCloseConfirm(name: string): string {
  return `关闭后，门户将不再展示该目的地；已产生的意向仍保留。直链门店将对客显示为暂不可提交意向。确认关闭「${name}」？`
}
