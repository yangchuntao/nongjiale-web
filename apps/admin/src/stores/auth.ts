import { TOKEN_KEYS } from '@nongjiale/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchAdminMe } from '../api/admin'
import { ADMIN_PROFILE_KEY, type AdminLoginData, type AdminMe } from '../api/readers'
import { browserStorage } from '../utils/storage'

const storageKey = TOKEN_KEYS.admin

export interface AdminProfile {
  expiresAt: string
  adminId: string
  phone: string
  role: string
  displayName: string
}

function readProfile(raw: string | null): AdminProfile | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AdminProfile>
    return {
      expiresAt: typeof parsed.expiresAt === 'string' ? parsed.expiresAt : '',
      adminId: typeof parsed.adminId === 'string' ? parsed.adminId : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      role: typeof parsed.role === 'string' ? parsed.role : '',
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : '',
    }
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const profile = ref<AdminProfile | null>(null)
  const isAuthenticated = computed(() => Boolean(token.value))
  const displayName = computed(() => profile.value?.displayName ?? '')

  function persist(next: AdminProfile) {
    profile.value = next
    browserStorage()?.setItem(ADMIN_PROFILE_KEY, JSON.stringify(next))
  }

  function hydrate() {
    token.value = browserStorage()?.getItem(storageKey) ?? null
    profile.value = token.value ? readProfile(browserStorage()?.getItem(ADMIN_PROFILE_KEY) ?? null) : null
  }

  function setToken(value: string) {
    token.value = value
    browserStorage()?.setItem(storageKey, value)
  }

  function setSession(login: AdminLoginData) {
    setToken(login.token)
    persist({
      expiresAt: login.expiresAt,
      adminId: login.adminId,
      phone: profile.value?.phone ?? '',
      role: login.role,
      displayName: login.displayName,
    })
  }

  function applyMe(me: AdminMe) {
    persist({
      expiresAt: profile.value?.expiresAt ?? '',
      adminId: me.adminId,
      phone: me.phone,
      role: me.role,
      displayName: me.displayName,
    })
  }

  async function refreshMe() {
    if (!token.value) return
    applyMe(await fetchAdminMe())
  }

  function logout() {
    token.value = null
    profile.value = null
    browserStorage()?.removeItem(storageKey)
    browserStorage()?.removeItem(ADMIN_PROFILE_KEY)
  }

  return { token, profile, displayName, isAuthenticated, hydrate, setToken, setSession, applyMe, refreshMe, logout }
})
