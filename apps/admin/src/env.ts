const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export const appLabel = '运营端'

export const apiBase = import.meta.env.VITE_API_BASE?.trim() || 'http://localhost:8080'

export const siteName = import.meta.env.VITE_SITE_NAME?.trim() || '站点名称'

export const primaryColor = HEX_COLOR.test(import.meta.env.VITE_PRIMARY_COLOR ?? '')
  ? (import.meta.env.VITE_PRIMARY_COLOR as string)
  : '#2F6B4F'

export const contactPhone = import.meta.env.VITE_CONTACT_PHONE?.trim() || '400-000-0000'

if (import.meta.env.VITE_USE_MOCK === 'true' && import.meta.env.DEV) {
  console.warn('VITE_USE_MOCK 已忽略：本脚手架不注入业务假数据。')
}
