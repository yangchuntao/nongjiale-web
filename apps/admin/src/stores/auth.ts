import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AdminLoginResult } from '@nongjiale/shared'
import * as api from '../api'

const TOKEN_KEY = 'nj_admin_token'
const USER_KEY = 'nj_admin_user'

export const useAuthStore = defineStore('admin-auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const profile = ref<Omit<AdminLoginResult, 'token'> | null>(
    (() => {
      try {
        return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
      } catch {
        return null
      }
    })(),
  )

  const isLoggedIn = computed(() => !!token.value)
  const isOperator = computed(() => profile.value?.role === 'OPERATOR')

  async function login(username: string, password: string) {
    const data = await api.adminLogin(username, password)
    token.value = data.token
    profile.value = {
      adminId: data.adminId,
      username: data.username,
      displayName: data.displayName,
      role: data.role,
    }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(profile.value))
  }

  function logout() {
    token.value = null
    profile.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, profile, isLoggedIn, isOperator, login, logout }
})
