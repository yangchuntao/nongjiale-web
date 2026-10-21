import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BRAND,
  DEFAULT_BRAND_HOVER,
  DEFAULT_BRAND_SOFT,
  DEFAULT_SURFACE_MUTED,
  darkenHex,
  elementPrimaryVars,
  mixWithBlack,
  mixWithWhite,
  normalizeHex,
  onBrandText,
} from './brand'

describe('brand tokens', () => {
  it('uses the water-town green defaults', () => {
    expect(DEFAULT_BRAND).toBe('#2C6B4F')
    expect(DEFAULT_BRAND_HOVER).toBe('#255C46')
    expect(DEFAULT_BRAND_SOFT).toBe('#EFF6F1')
    expect(DEFAULT_SURFACE_MUTED).toBe('#FCFCF8')
    expect(DEFAULT_BRAND).not.toBe('#4BA3D9')
  })

  it('picks white text on the default green brand', () => {
    expect(onBrandText('#2C6B4F')).toBe('#FFFFFF')
    expect(onBrandText('#4BA3D9')).toBe('#1A1A1A')
    expect(onBrandText('#1B4F72')).toBe('#FFFFFF')
  })

  it('normalizes short hex and rejects other strings', () => {
    expect(normalizeHex('#4ba')).toBe('#44BBAA')
    expect(normalizeHex('green')).toBeNull()
    expect(darkenHex('#2C6B4F')).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('fills the element plus primary scale', () => {
    const vars = elementPrimaryVars('#2C6B4F')
    expect(vars['--el-color-primary']).toBe('#2C6B4F')
    expect(vars['--el-color-primary-rgb']).toBe('44, 107, 79')
    expect(vars['--el-color-primary-light-3']).toBe(mixWithWhite('#2C6B4F', 0.3))
    expect(vars['--el-color-primary-light-5']).toBe(mixWithWhite('#2C6B4F', 0.5))
    expect(vars['--el-color-primary-light-7']).toBe(mixWithWhite('#2C6B4F', 0.7))
    expect(vars['--el-color-primary-light-8']).toBe(mixWithWhite('#2C6B4F', 0.8))
    expect(vars['--el-color-primary-light-9']).toBe(mixWithWhite('#2C6B4F', 0.9))
    expect(vars['--el-color-primary-dark-2']).toBe(mixWithBlack('#2C6B4F', 0.2))
    expect(vars['--color-on-brand']).toBe('#FFFFFF')
    expect(vars['--color-brand-hover']).toBeUndefined()
    expect(elementPrimaryVars('#1B4F72')['--el-color-primary-dark-2']).toMatch(/^#[0-9A-F]{6}$/)
    expect(elementPrimaryVars('#1B4F72')['--color-on-brand']).toBe('#FFFFFF')
  })
})
