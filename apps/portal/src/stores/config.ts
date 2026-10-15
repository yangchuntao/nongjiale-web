import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../api'

const FALLBACK_PHONE = import.meta.env.VITE_CONTACT_PHONE || '13651814168'
const FALLBACK_NAME = '农家乐 · 长三角'

function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export const useConfigStore = defineStore('config', () => {
  const contactPhone = ref(FALLBACK_PHONE)
  const siteName = ref(FALLBACK_NAME)
  const primaryColor = ref('')
  const loaded = ref(false)

  async function load() {
    try {
      const data = await api.fetchPublicConfig()
      if (!data || typeof data !== 'object') return
      if (typeof data.contactPhone === 'string' && data.contactPhone) {
        contactPhone.value = data.contactPhone
      }
      if (typeof data.siteName === 'string' && data.siteName.trim()) {
        siteName.value = data.siteName.trim()
        document.title = siteName.value
      }
      if (typeof data.primaryColor === 'string' && isHexColor(data.primaryColor)) {
        primaryColor.value = data.primaryColor
        document.documentElement.style.setProperty('--brand', data.primaryColor)
        document.documentElement.style.setProperty('--brand-dark', data.primaryColor)
      }
    } catch {
      contactPhone.value = contactPhone.value || FALLBACK_PHONE
    } finally {
      loaded.value = true
    }
  }

  return { contactPhone, siteName, primaryColor, loaded, load }
})
