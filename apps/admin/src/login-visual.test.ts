import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('admin login visual', () => {
  it('uses the brand title and a 2px brand focus ring on the muted page', () => {
    const view = readFileSync(new URL('./views/LoginView.vue', import.meta.url), 'utf8')
    const css = readFileSync(new URL('./styles/admin.css', import.meta.url), 'utf8')
    const shell = readFileSync(new URL('./App.vue', import.meta.url), 'utf8')
    expect(view).toContain('class="login-title"')
    expect(view).toContain('运营登录')
    expect(css).toContain('color: var(--color-brand, #4ba3d9)')
    expect(css).toContain('box-shadow: 0 0 0 2px var(--color-brand, #4ba3d9)')
    expect(shell).toContain('#f4f8fb')
  })
})
