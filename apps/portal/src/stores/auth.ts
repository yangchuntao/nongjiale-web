import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TouristUser } from '@nongjiale/shared'
import * as api from '../api'
import { ApiError } from '../utils/http'

const TOKEN_KEY = 'nj_portal_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<TouristUser | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  async function login(phone: string, password: string) {
    loading.value = true
    try {
      const data = await api.login(phone, password)
      token.value = data.token
      localStorage.setItem(TOKEN_KEY, data.token)
      user.value = {
        userId: data.userId,
        phone: data.phone,
        displayName: data.displayName,
      }
      return data
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  async function hydrate() {
    if (!token.value) return
    try {
      user.value = await api.fetchMe(token.value)
    } catch (e) {
      if (e instanceof ApiError && e.httpStatus === 401) logout()
    }
  }

  return { token, user, loading, isLoggedIn, login, logout, hydrate }
})
