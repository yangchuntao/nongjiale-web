const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/
const ZONED = /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))$/

interface WallClock {
  year: number
  month: number
  day: number
  hour: number | null
  minute: number | null
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function isCalendarDay(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12 || day < 1) return false
  const probe = new Date(Date.UTC(year, month - 1, day))
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day
}

function isClock(hour: number, minute: number): boolean {
  return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function dateText(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

function dateTimeText(year: number, month: number, day: number, hour: number, minute: number): string {
  return `${dateText(year, month, day)} ${pad(hour)}:${pad(minute)}`
}

function fromNumbers(year: number, month: number, day: number, hour: number | null, minute: number | null): WallClock | null {
  if (!isCalendarDay(year, month, day)) return null
  if (hour === null || minute === null) return { year, month, day, hour: null, minute: null }
  if (!isClock(hour, minute)) return null
  return { year, month, day, hour, minute }
}

function fromArray(value: unknown): WallClock | null {
  if (!Array.isArray(value) || value.length < 3) return null
  if (!value.every((part) => typeof part === 'number' && Number.isFinite(part))) return null
  const year = value[0] as number
  const month = value[1] as number
  const day = value[2] as number
  const hour = value.length >= 4 ? (value[3] as number) : 0
  const minute = value.length >= 5 ? (value[4] as number) : 0
  return fromNumbers(year, month, day, hour, minute)
}

function fromZoned(value: string): WallClock | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return fromNumbers(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes())
}

function parse(value: unknown): WallClock | null {
  const listed = fromArray(value)
  if (listed) return listed
  if (Array.isArray(value)) return null
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text) return null
  const dateOnly = DATE_ONLY.exec(text)
  if (dateOnly) return fromNumbers(Number(dateOnly[1]), Number(dateOnly[2]), Number(dateOnly[3]), null, null)
  if (ZONED.test(text)) return fromZoned(text)
  const wall = WALL_CLOCK.exec(text)
  if (!wall) return null
  return fromNumbers(Number(wall[1]), Number(wall[2]), Number(wall[3]), Number(wall[4]), Number(wall[5]))
}

/** 日历日，固定 `yyyy-MM-dd`。带时区的时间戳按本地日历日。 */
export function formatDate(value: unknown): string {
  const wall = parse(value)
  if (!wall) return ''
  return dateText(wall.year, wall.month, wall.day)
}

/** 展示用时间。有钟点时为 `yyyy-MM-dd HH:mm`，纯日期保持 `yyyy-MM-dd`。 */
export function formatDateTime(value: unknown): string {
  const wall = parse(value)
  if (!wall) return ''
  if (wall.hour === null || wall.minute === null) return dateText(wall.year, wall.month, wall.day)
  return dateTimeText(wall.year, wall.month, wall.day, wall.hour, wall.minute)
}
