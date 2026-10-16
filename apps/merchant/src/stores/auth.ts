import { TOKEN_KEYS } from '@nongjiale/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { MerchantLoginData } from '../api/readers'
import { browserStorage } from '../utils/storage'

const storageKey = TOKEN_KEYS.merchant
const profileKey = 'nj_merchant_profile'

export interface MerchantProfile {
  expiresAt: string
  merchantUserId: string
  merchantOrgId: string
  role: string
  displayName: string
}

function readProfile(raw: string | null): MerchantProfile | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<MerchantProfile>
    return {
      expiresAt: typeof parsed.expiresAt === 'string' ? parsed.expiresAt : '',
      merchantUserId: typeof parsed.merchantUserId === 'string' ? parsed.merchantUserId : '',
      merchantOrgId: typeof parsed.merchantOrgId === 'string' ? parsed.merchantOrgId : '',
      role: typeof parsed.role === 'string' ? parsed.role : '',
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : '',
    }
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const profile = ref<MerchantProfile | null>(null)
  const isAuthenticated = computed(() => Boolean(token.value))
  const displayName = computed(() => profile.value?.displayName ?? '')

  function hydrate() {
    token.value = browserStorage()?.getItem(storageKey) ?? null
    profile.value = token.value ? readProfile(browserStorage()?.getItem(profileKey) ?? null) : null
  }

  function setToken(value: string) {
    token.value = value
    browserStorage()?.setItem(storageKey, value)
  }

  function setSession(login: MerchantLoginData) {
    setToken(login.token)
    const next: MerchantProfile = {
      expiresAt: login.expiresAt,
      merchantUserId: login.merchantUserId,
      merchantOrgId: login.merchantOrgId,
      role: login.role,
      displayName: login.displayName,
    }
    profile.value = next
    browserStorage()?.setItem(profileKey, JSON.stringify(next))
  }

  function logout() {
    token.value = null
    profile.value = null
    browserStorage()?.removeItem(storageKey)
    browserStorage()?.removeItem(profileKey)
  }

  return { token, profile, displayName, isAuthenticated, hydrate, setToken, setSession, logout }
})
