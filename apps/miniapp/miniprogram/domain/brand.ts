import { BRAND } from '../config'

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function normalizeHex(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? ''
  if (!HEX.test(raw)) return null
  const body = raw.slice(1)
  const full = body.length === 3 ? body.split('').map((char) => char + char).join('') : body
  return `#${full.toUpperCase()}`
}

function rgb(hex: string): [number, number, number] {
  const full = normalizeHex(hex) ?? BRAND
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
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

export function onBrandText(hex: string): '#1A1A1A' | '#FFFFFF' {
  const dark = '#1A1A1A'
  const light = '#FFFFFF'
  return contrast(light, hex) >= contrast(dark, hex) ? light : dark
}
