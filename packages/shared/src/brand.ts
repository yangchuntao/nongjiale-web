/** 浅蓝默认主色。站点配置 brandColor 可覆盖，不再回退田园绿。 */
export const DEFAULT_BRAND = '#4BA3D9'
export const DEFAULT_BRAND_HOVER = '#3A8FC4'
export const DEFAULT_BRAND_SOFT = '#E8F4FC'
export const DEFAULT_SURFACE_MUTED = '#F4F8FB'
export const DEFAULT_SITE_NAME = '站点名称'
export const DEFAULT_CONTACT_PHONE = '400-000-0000'

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function normalizeHex(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? ''
  if (!HEX.test(raw)) return null
  const body = raw.slice(1)
  const full = body.length === 3 ? body.split('').map((char) => char + char).join('') : body
  return `#${full.toUpperCase()}`
}

function rgb(hex: string): [number, number, number] {
  const full = normalizeHex(hex) ?? DEFAULT_BRAND
  const value = Number.parseInt(full.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function linear(channel: number): number {
  const s = channel / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground)
  const b = luminance(background)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

/** 主按钮字色。浅蓝默认底用深色字，深色主色仍用白字。 */
export function onBrandText(hex: string): '#1A1A1A' | '#FFFFFF' {
  const dark = '#1A1A1A'
  const light = '#FFFFFF'
  return contrast(light, hex) >= contrast(dark, hex) ? light : dark
}

export function darkenHex(hex: string, amount = 0.14): string {
  const [r, g, b] = rgb(hex)
  const scale = 1 - Math.min(Math.max(amount, 0), 1)
  const channel = (value: number) => Math.round(value * scale).toString(16).padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase()
}

export function mixWithWhite(hex: string, whiteWeight = 0.88): string {
  const [r, g, b] = rgb(hex)
  const weight = Math.min(Math.max(whiteWeight, 0), 1)
  const channel = (value: number) =>
    Math.round(value * (1 - weight) + 255 * weight)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase()
}

/** 把主色写到门户 CSS 变量，并同步 Element Plus primary。 */
export function applyBrandColor(color: string | null | undefined): void {
  if (typeof document === 'undefined') return
  const hex = normalizeHex(color) ?? DEFAULT_BRAND
  const root = document.documentElement
  root.style.setProperty('--color-brand', hex)
  root.style.setProperty('--el-color-primary', hex)
  root.style.setProperty('--color-on-brand', onBrandText(hex))
  if (hex === DEFAULT_BRAND) {
    root.style.removeProperty('--color-brand-hover')
    root.style.removeProperty('--color-brand-soft')
    return
  }
  root.style.setProperty('--color-brand-hover', darkenHex(hex))
  root.style.setProperty('--color-brand-soft', mixWithWhite(hex))
}
