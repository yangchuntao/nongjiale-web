import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BRAND,
  DEFAULT_BRAND_HOVER,
  DEFAULT_BRAND_SOFT,
  DEFAULT_SURFACE_MUTED,
  darkenHex,
  normalizeHex,
  onBrandText,
} from './brand'

describe('brand tokens', () => {
  it('uses the light blue defaults', () => {
    expect(DEFAULT_BRAND).toBe('#4BA3D9')
    expect(DEFAULT_BRAND_HOVER).toBe('#3A8FC4')
    expect(DEFAULT_BRAND_SOFT).toBe('#E8F4FC')
    expect(DEFAULT_SURFACE_MUTED).toBe('#F4F8FB')
    expect(DEFAULT_BRAND).not.toBe('#2F6B4F')
  })

  it('picks dark text on the default light blue brand', () => {
    expect(onBrandText('#4BA3D9')).toBe('#1A1A1A')
    expect(onBrandText('#1B4F72')).toBe('#FFFFFF')
  })

  it('normalizes short hex and rejects other strings', () => {
    expect(normalizeHex('#4ba')).toBe('#44BBAA')
    expect(normalizeHex('green')).toBeNull()
    expect(darkenHex('#4BA3D9')).toMatch(/^#[0-9A-F]{6}$/)
  })
})