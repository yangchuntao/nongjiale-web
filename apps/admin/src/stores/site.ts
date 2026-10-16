import { applyBrandColor, normalizeHex } from '@nongjiale/shared'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchSiteConfig } from '../api/admin'
import { contactPhone, primaryColor, siteName } from '../env'

export const useSiteStore = defineStore('site', () => {
  const name = ref(siteName)
  const color = ref(primaryColor)
  const phone = ref(contactPhone)

  function applyBrand() {
    applyBrandColor(color.value)
  }

  function applyConfig(next: { siteName: string; brandColor: string; contactPhone: string }) {
    if (next.siteName.trim()) name.value = next.siteName.trim()
    if (next.contactPhone.trim()) phone.value = next.contactPhone.trim()
    const parsed = normalizeHex(next.brandColor)
    if (parsed) color.value = parsed
    applyBrand()
  }

  async function loadFromAdmin() {
    try {
      applyConfig(await fetchSiteConfig())
    } catch {
      applyBrand()
    }
  }

  return { name, color, phone, applyBrand, applyConfig, loadFromAdmin }
})
