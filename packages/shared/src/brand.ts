/** 默认主色：水乡绿（垛田墨绿）。站点配置 brandColor 可覆盖。 */
export const DEFAULT_BRAND = '#2C6B4F'
export const DEFAULT_BRAND_HOVER = '#255C46'
export const DEFAULT_BRAND_SOFT = '#EFF6F1'
/** 门户纸面底色（亚麻暖白），与 --paper 对应。 */
export const DEFAULT_SURFACE_MUTED = '#FCFCF8'
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

/** 主按钮字色。按对比度取黑或白：垛田绿 #2C6B4F 用白字，浅色主色自动落到深字。 */
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

export function mixWithBlack(hex: string, blackWeight = 0.2): string {
  const [r, g, b] = rgb(hex)
  const weight = Math.min(Math.max(blackWeight, 0), 1)
  const channel = (value: number) =>
    Math.round(value * (1 - weight))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase()
}

/** Element Plus primary 阶。light-N 为 N×10% 白，dark-2 为 20% 黑。 */
export function elementPrimaryVars(color: string | null | undefined): Record<string, string> {
  const hex = normalizeHex(color) ?? DEFAULT_BRAND
  const [r, g, b] = rgb(hex)
  const vars: Record<string, string> = {
    '--color-brand': hex,
    '--color-on-brand': onBrandText(hex),
    '--el-color-primary': hex,
    '--el-color-primary-rgb': `${r}, ${g}, ${b}`,
    '--el-color-primary-light-3': mixWithWhite(hex, 0.3),
    '--el-color-primary-light-5': mixWithWhite(hex, 0.5),
    '--el-color-primary-light-7': mixWithWhite(hex, 0.7),
    '--el-color-primary-light-8': mixWithWhite(hex, 0.8),
    '--el-color-primary-light-9': mixWithWhite(hex, 0.9),
    '--el-color-primary-dark-2': mixWithBlack(hex, 0.2),
  }
  if (hex !== DEFAULT_BRAND) {
    vars['--color-brand-hover'] = darkenHex(hex)
    vars['--color-brand-soft'] = mixWithWhite(hex)
  }
  return vars
}

/** 把主色写到 CSS 变量，并补齐 Element Plus primary 的 light / dark 阶。 */
export function applyBrandColor(color: string | null | undefined): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const vars = elementPrimaryVars(color)
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
  if (!vars['--color-brand-hover']) {
    root.style.removeProperty('--color-brand-hover')
    root.style.removeProperty('--color-brand-soft')
  }
}
