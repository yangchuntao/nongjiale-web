import { DEFAULT_BRAND, DEFAULT_CONTACT_PHONE, DEFAULT_SITE_NAME, normalizeHex } from '@nongjiale/shared'

export const appLabel = '运营端'

export const apiBase = import.meta.env.VITE_API_BASE?.trim() || 'http://localhost:8080'

export const siteName = import.meta.env.VITE_SITE_NAME?.trim() || DEFAULT_SITE_NAME

export const primaryColor = normalizeHex(import.meta.env.VITE_PRIMARY_COLOR) ?? DEFAULT_BRAND

export const contactPhone = import.meta.env.VITE_CONTACT_PHONE?.trim() || DEFAULT_CONTACT_PHONE

if (import.meta.env.VITE_USE_MOCK === 'true' && import.meta.env.DEV) {
  console.warn('VITE_USE_MOCK 已忽略：本脚手架不注入业务假数据。')
}
