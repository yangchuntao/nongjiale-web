import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../api'

const FALLBACK = import.meta.env.VITE_CONTACT_PHONE || '13651814168'

export const useConfigStore = defineStore('config', () => {
  const contactPhone = ref(FALLBACK)
  const loaded = ref(false)

  async function load() {
    try {
      const data = await api.fetchPublicConfig()
      if (data.contactPhone) contactPhone.value = data.contactPhone
    } catch {
      contactPhone.value = FALLBACK
    } finally {
      loaded.value = true
    }
  }

  return { contactPhone, loaded, load }
})
