import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { WEEKDAY_LABELS, commitDateText, monthCells, monthTitle, shiftMonth, viewFromValue } from './date-field'

describe('date field', () => {
  it('commits only yyyy-MM-dd text', () => {
    expect(commitDateText('')).toBe('')
    expect(commitDateText(' 2026-10-20 ')).toBe('2026-10-20')
    expect(commitDateText('2026-10-20T08:00:00')).toBe('2026-10-20')
    expect(commitDateText('2026-10-2')).toBeNull()
    expect(commitDateText('10/20/2026')).toBeNull()
    expect(commitDateText('2026-02-31')).toBeNull()
  })

  it('builds a Chinese month grid for October 2026', () => {
    expect(WEEKDAY_LABELS.join('')).toBe('一二三四五六日')
    expect(monthTitle(2026, 10)).toBe('2026年10月')
    const cells = monthCells(2026, 10)
    expect(cells.slice(0, 3)).toEqual([null, null, null])
    expect(cells[3]).toEqual({ day: 1, iso: '2026-10-01' })
    expect(cells.at(-1)).toEqual({ day: 31, iso: '2026-10-31' })
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 })
    expect(viewFromValue('2026-10-20', new Date('2026-01-15T00:00:00'))).toEqual({ year: 2026, month: 10 })
    expect(viewFromValue('', new Date(2026, 0, 15))).toEqual({ year: 2026, month: 1 })
  })

  it('does not use a browser-locale date input on the intent form', () => {
    const form = readFileSync(new URL('../views/IntentFormView.vue', import.meta.url), 'utf8')
    const field = readFileSync(new URL('../components/DateField.vue', import.meta.url), 'utf8')
    expect(form).not.toContain('type="date"')
    expect(form).toContain('DateField')
    expect(field).toContain('type="text"')
    expect(field).toContain('placeholder="yyyy-MM-dd"')
    expect(field).not.toContain('type="date"')
  })
})
