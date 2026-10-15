export function pageCount(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 1
  return Math.ceil(total / pageSize)
}

export function pageList(page: number, count: number): number[] {
  const end = Math.min(count, Math.max(page + 2, 5))
  const start = Math.max(1, end - 4)
  const last = Math.min(count, start + 4)
  const pages: number[] = []
  for (let current = start; current <= last; current += 1) pages.push(current)
  return pages
}
