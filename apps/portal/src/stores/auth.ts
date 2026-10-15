import { TOKEN_KEYS } from '@nongjiale/shared'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { browserStorage } from '../utils/storage'

const storageKey = TOKEN_KEYS.portal

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => Boolean(token.value))

  function hydrate() {
    token.value = browserStorage()?.getItem(storageKey) ?? null
  }

  /** 登录接口接入前，脚手架表单不得调用。 */
  function setToken(value: string) {
    token.value = value
    browserStorage()?.setItem(storageKey, value)
  }

  function logout() {
    token.value = null
    browserStorage()?.removeItem(storageKey)
  }

  return { token, isAuthenticated, hydrate, setToken, logout }
})
