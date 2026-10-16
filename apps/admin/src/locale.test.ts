import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('admin date locale', () => {
  it('shows date pickers as yyyy-MM-dd in zh-CN', () => {
    const view = readFileSync(new URL('./views/IntentsView.vue', import.meta.url), 'utf8')
    const pickers = view.match(/<el-date-picker\b[^>]*>/g) ?? []
    expect(pickers.length).toBeGreaterThan(0)
    for (const picker of pickers) {
      expect(picker).toMatch(/(?:^|\s)format="YYYY-MM-DD"/)
      expect(picker).toContain('value-format="YYYY-MM-DD"')
    }
    const main = readFileSync(new URL('./main.ts', import.meta.url), 'utf8')
    expect(main).toContain("element-plus/es/locale/lang/zh-cn")
    expect(main).toContain('locale: zhCn')
  })
})
