/** 与门户默认接口基址相同。体验版真机不要用 localhost。 */
export const DEFAULT_API_BASE = 'http://localhost:8080'

/**
 * 开发者工具本地存储可覆盖基址，值为已配置的 https 源。
 * 不把生产域名写进仓库。
 */
export const API_BASE_STORAGE_KEY = 'nj_mp_api_base'

/**
 * 微信公众平台配好业务域名后，在本地存储把该键设为 `1` 才打开 web-view。
 * 缺省不打开，外链只复制。
 */
export const WEBVIEW_READY_KEY = 'nj_mp_webview_ready'

/** 只有 accountLinked=true 的游客令牌写入这个微信存储键。 */
export const MP_TOKEN_KEY = 'nj_mp_token'

export const PAGE_SIZE = 20

export const KEYWORD_MAX = 64

export const BANNER_INTERVAL_MS = 5000

export const BRAND = '#4BA3D9'
export const BRAND_SOFT = '#E8F4FC'
export const BRAND_HOVER = '#3A8FC4'

export const CLOSED_DESTINATION_HINT = '该目的地暂未开通'

export const UNLINKED_BANNER = '网页版意向同步即将开通，当前仅显示本端提交的意向'

export const PHONE_REQUIRED_MESSAGE = '请先绑定手机号，完成与网页版账号打通后再提交意向'

export const LISTING_GONE_MESSAGE = '已下架或不可用'

export const LISTING_MISSING_MESSAGE = '房源不存在'

export const INTENT_MISSING_MESSAGE = '意向不存在'
