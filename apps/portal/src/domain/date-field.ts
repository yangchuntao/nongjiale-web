import { formatDate } from '@nongjiale/shared'

export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const

export interface MonthCell {
  day: number
  iso: string
}

/** 空字符串清空；完整日历日写入 `yyyy-MM-dd`；未写完或无法识别则不提交。 */
export function commitDateText(raw: string): string | null {
  const text = raw.trim()
  if (!text) return ''
  const formatted = formatDate(text)
  return formatted || null
}

export function monthTitle(year: number, month: number): string {
  return `${year}年${String(month).padStart(2, '0')}月`
}

export function monthCells(year: number, month: number): Array<MonthCell | null> {
  const leading = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const days = new Date(year, month, 0).getDate()
  const cells: Array<MonthCell | null> = Array.from({ length: leading }, () => null)
  for (let day = 1; day <= days; day += 1) {
    cells.push({ day, iso: formatDate([year, month, day]) })
  }
  return cells
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const next = new Date(year, month - 1 + delta, 1)
  return { year: next.getFullYear(), month: next.getMonth() + 1 }
}

export function viewFromValue(value: string, today = new Date()): { year: number; month: number } {
  const formatted = formatDate(value)
  if (!formatted) return { year: today.getFullYear(), month: today.getMonth() + 1 }
  const [year, month] = formatted.split('-').map(Number)
  return { year: year ?? today.getFullYear(), month: month ?? today.getMonth() + 1 }
}
