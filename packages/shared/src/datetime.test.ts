import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime } from './datetime'

function localStamp(iso: string): string {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

describe('formatDate', () => {
  it('formats calendar dates as yyyy-MM-dd', () => {
    expect(formatDate('2026-10-20')).toBe('2026-10-20')
    expect(formatDate(' 2026-01-02 ')).toBe('2026-01-02')
    expect(formatDate([2026, 10, 20])).toBe('2026-10-20')
    expect(formatDate([2026, 1, 2])).toBe('2026-01-02')
  })

  it('reads the calendar day from a timestamp without keeping ISO text', () => {
    expect(formatDate('2026-10-15T08:00:00')).toBe('2026-10-15')
    expect(formatDate('2026-10-16T05:12:00.000Z')).toBe(localStamp('2026-10-16T05:12:00.000Z').slice(0, 10))
  })

  it('returns empty for blank or unreadable values', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
    expect(formatDate('not-a-date')).toBe('')
    expect(formatDate('2026-02-31')).toBe('')
  })
})

describe('formatDateTime', () => {
  it('formats Jackson arrays as yyyy-MM-dd HH:mm', () => {
    expect(formatDateTime([2026, 10, 15, 9, 30])).toBe('2026-10-15 09:30')
    expect(formatDateTime([2026, 10, 15])).toBe('2026-10-15 00:00')
  })

  it('formats offset-less timestamps as the written clock', () => {
    expect(formatDateTime('2026-10-15T08:00:00')).toBe('2026-10-15 08:00')
    expect(formatDateTime('2026-10-15T08:00:00.000')).toBe('2026-10-15 08:00')
    expect(formatDateTime('2026-10-21 09:00')).toBe('2026-10-21 09:00')
    expect(formatDateTime('2026-10-21 09:00:45')).toBe('2026-10-21 09:00')
  })

  it('formats zoned timestamps in local time and never returns raw ISO', () => {
    const raw = '2026-10-16T05:12:00.000Z'
    expect(formatDateTime(raw)).toBe(localStamp(raw))
    expect(formatDateTime(raw)).not.toContain('T')
    expect(formatDateTime('2026-10-16T05:12:00+08:00')).toBe(localStamp('2026-10-16T05:12:00+08:00'))
  })

  it('keeps a date-only string as a date', () => {
    expect(formatDateTime('2026-10-20')).toBe('2026-10-20')
  })

  it('returns empty for blank or unreadable values', () => {
    expect(formatDateTime('')).toBe('')
    expect(formatDateTime(undefined)).toBe('')
    expect(formatDateTime('not-a-date')).toBe('')
  })
})
