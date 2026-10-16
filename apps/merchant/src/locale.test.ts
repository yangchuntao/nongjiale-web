import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('merchant date locale', () => {
  it('registers Element Plus with zh-CN', () => {
    const main = readFileSync(new URL('./main.ts', import.meta.url), 'utf8')
    expect(main).toContain("element-plus/es/locale/lang/zh-cn")
    expect(main).toContain('locale: zhCn')
  })
})