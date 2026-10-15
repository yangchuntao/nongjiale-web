import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { MerchantProfile } from '@nongjiale/shared'
import * as api from '../api'
import { ApiError } from '../utils/http'

const TOKEN_KEY = 'nj_merchant_token'
const PROFILE_KEY = 'nj_merchant_profile'

function readProfile(): MerchantProfile | null {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('merchant-auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const profile = ref<MerchantProfile | null>(readProfile())

  const isLoggedIn = computed(() => !!token.value)
  const mustChangePassword = computed(() => profile.value?.mustChangePassword === true)

  function persist(next: MerchantProfile | null) {
    profile.value = next
    if (next) localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    else localStorage.removeItem(PROFILE_KEY)
  }

  async function login(phone: string, password: string) {
    const data = await api.merchantLogin(phone, password)
    token.value = data.token
    localStorage.setItem(TOKEN_KEY, data.token)
    persist({
      merchantUserId: data.merchantUserId,
      merchantId: data.merchantId,
      subjectName: data.subjectName,
      phone: data.phone,
      role: data.role,
      mustChangePassword: data.mustChangePassword === true,
    })
  }

  function logout() {
    token.value = null
    persist(null)
    localStorage.removeItem(TOKEN_KEY)
  }

  function markMustChangePassword() {
    if (!profile.value) return
    persist({ ...profile.value, mustChangePassword: true })
  }

  function markPasswordChanged() {
    if (!profile.value) return
    persist({ ...profile.value, mustChangePassword: false })
  }

  async function hydrate() {
    if (!token.value) return
    try {
      const me = await api.fetchMe(token.value)
      persist({
        merchantUserId: me.merchantUserId,
        merchantId: me.merchantId,
        subjectName: me.subjectName,
        phone: me.phone,
        role: me.role,
        mustChangePassword: me.mustChangePassword === true,
      })
    } catch (e) {
      if (e instanceof ApiError && e.httpStatus === 401) logout()
    }
  }

  return {
    token,
    profile,
    isLoggedIn,
    mustChangePassword,
    login,
    logout,
    hydrate,
    markMustChangePassword,
    markPasswordChanged,
  }
})
