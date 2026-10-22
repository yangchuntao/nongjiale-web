import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('admin login visual', () => {
  it('uses the brand title and a 2px brand focus ring on the paper page', () => {
    const view = readFileSync(new URL('./views/LoginView.vue', import.meta.url), 'utf8')
    const css = readFileSync(new URL('./styles/admin.css', import.meta.url), 'utf8')
    const shell = readFileSync(new URL('./App.vue', import.meta.url), 'utf8')
    const frame = readFileSync(new URL('./components/ConsoleFrame.vue', import.meta.url), 'utf8')
    expect(view).toContain('class="login-title"')
    expect(view).toContain('运营登录')
    expect(view).toContain('class="login-shell"')
    expect(view).toContain('class="login-brand"')
    expect(css).toContain('var(--color-brand, var(--brand-600))')
    expect(css).toContain('0 0 0 2px var(--color-brand, var(--brand-600))')
    // 暖纸底，不再用冷灰 #f4f8fb
    expect(shell).toContain('var(--paper, #fcfcf8)')
    expect(shell).not.toContain('#f4f8fb')
    // 外壳：可折叠分组侧栏 + 面包屑 + 头像区
    expect(frame).toContain('class="crumb"')
    expect(frame).toContain('el-sub-menu')
    expect(frame).toContain('内容与货架')
    expect(frame).toContain('class="avatar"')
  })
})
