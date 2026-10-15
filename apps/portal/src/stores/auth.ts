import { TOKEN_KEYS } from '@nongjiale/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchMe } from '../api/portal'
import type { TouristProfile } from '../api/readers'
import { browserStorage } from '../utils/storage'

const storageKey = TOKEN_KEYS.portal

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const profile = ref<TouristProfile | null>(null)
  const isAuthenticated = computed(() => Boolean(token.value))
  const phone = computed(() => profile.value?.phone ?? '')

  function hydrate() {
    token.value = browserStorage()?.getItem(storageKey) ?? null
  }

  function setToken(value: string) {
    token.value = value
    browserStorage()?.setItem(storageKey, value)
  }

  function logout() {
    token.value = null
    profile.value = null
    browserStorage()?.removeItem(storageKey)
  }

  async function refreshProfile() {
    if (!token.value) {
      profile.value = null
      return
    }
    try {
      profile.value = await fetchMe()
    } catch {
      profile.value = null
    }
  }

  return { token, profile, phone, isAuthenticated, hydrate, setToken, logout, refreshProfile }
})
