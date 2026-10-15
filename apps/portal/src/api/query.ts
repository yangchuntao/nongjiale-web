/** 门户列表 URL 的 `q` 在请求层映射为后端 `keyword`。 */
export function mapListingSearch(params: Record<string, string | undefined>): Record<string, string> {
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (key === 'q' || value === undefined || value === '') continue
    next[key] = value
  }
  const keyword = params.q?.trim()
  if (keyword) next.keyword = keyword
  return next
}
