let storage: Storage | null | undefined

export function browserStorage(): Storage | null {
  if (storage !== undefined) return storage
  try {
    if (typeof localStorage === 'undefined') {
      storage = null
      return storage
    }
    const probe = '__nj_storage_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    storage = localStorage
  } catch {
    storage = null
  }
  return storage
}
