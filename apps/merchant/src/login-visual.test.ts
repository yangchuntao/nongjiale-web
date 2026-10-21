import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('merchant login visual', () => {
  it('uses the brand title and a 2px brand focus ring on the paper page', () => {
    const view = readFileSync(new URL('./views/LoginView.vue', import.meta.url), 'utf8')
    const css = readFileSync(new URL('./styles/merchant.css', import.meta.url), 'utf8')
    const shell = readFileSync(new URL('./App.vue', import.meta.url), 'utf8')
    const frame = readFileSync(new URL('./components/ConsoleFrame.vue', import.meta.url), 'utf8')
    expect(view).toContain('class="login-title"')
    expect(view).toContain('商家登录')
    expect(view).toContain('class="login-shell"')
    expect(view).toContain('class="login-brand"')
    expect(css).toContain('var(--color-brand, var(--brand-600))')
    expect(css).toContain('0 0 0 2px var(--color-brand, var(--brand-600))')
    expect(shell).toContain('var(--paper, #fcfcf8)')
    expect(shell).not.toContain('#f4f8fb')
    expect(frame).toContain('class="crumb"')
    expect(frame).toContain('class="side-group"')
    expect(frame).toContain('class="avatar"')
    // 商家端不出现广告位入口，也不在登录页出现「新建门店」
    expect(view).not.toContain('新建门店')
    expect(frame).not.toContain('广告位')
  })

  it('renders stores as water-town store rows', () => {
    const view = readFileSync(new URL('./views/StoreListView.vue', import.meta.url), 'utf8')
    expect(view).toContain('class="store-row"')
    expect(view).toContain('store-row__thumb')
    expect(view).toContain('store-row__meta')
    expect(view).toContain('class="stats"')
    expect(view).toContain('cover-art--paddy')
  })
})
