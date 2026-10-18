import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

function walk(dir: string): string[] {
  const files: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      if (name === 'node_modules') continue
      files.push(...walk(path))
      continue
    }
    files.push(path)
  }
  return files
}

describe('miniapp hard locks', () => {
  const files = walk(join(root, 'miniprogram')).concat([
    join(root, 'project.config.json'),
    join(root, 'project.private.config.sample.json'),
  ])

  it('keeps the committed appid empty and out of the private config', () => {
    const project = JSON.parse(readFileSync(join(root, 'project.config.json'), 'utf8')) as { appid: string }
    expect(project.appid).toBe('')
    const sample = readFileSync(join(root, 'project.private.config.sample.json'), 'utf8')
    expect(sample).toContain('"appid": ""')
    expect(files.some((file) => file.endsWith('project.private.config.json'))).toBe(false)
  })

  it('does not commit secrets, pastoral green, or payment entry points', () => {
    const banned = [/AppSecret/, /WECHAT_MINIAPP_SECRET\s*[:=]\s*['"][^'"]+['"]/, /#2F6B4F/i, /立即支付/, /付定金/, /钱包/, /收银台/, /商家入驻/]
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const pattern of banned) {
        expect(text, file).not.toMatch(pattern)
      }
    }
  })

  it('does not show forbidden checked-in labels outside the denylist', () => {
    const forbidden = ['已定着', '已订立', '已落实', '已落地', '已成交', '已达成']
    const allowed = new Set([join(root, 'miniprogram/domain/copy.ts')])
    for (const file of files) {
      if (allowed.has(file)) continue
      const text = readFileSync(file, 'utf8')
      for (const word of forbidden) expect(text, file).not.toContain(word)
    }
    const copy = readFileSync(join(root, 'miniprogram/domain/copy.ts'), 'utf8')
    expect(copy).toContain("CHECKED_IN: '已入住'")
  })
})
