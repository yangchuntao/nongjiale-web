import { applyBrandColor, normalizeHex } from '@nongjiale/shared'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '../api/client'
import { fetchSiteConfig } from '../api/admin'
import { contactPhone, primaryColor, siteName } from '../env'

interface PublicConfigBody {
  siteName?: string | null
  brandColor?: string | null
  contactPhone?: string | null
}

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

  /* 无需登录的公开配置：保证登录页与首次进入就有真实站名/品牌色 */
  async function loadPublic() {
    try {
      const data = await http.request<PublicConfigBody>('/api/config/public')
      applyConfig({
        siteName: data?.siteName ?? '',
        brandColor: data?.brandColor ?? '',
        contactPhone: data?.contactPhone ?? '',
      })
    } catch {
      applyBrand()
    }
  }

  async function loadFromAdmin() {
    try {
      applyConfig(await fetchSiteConfig())
    } catch {
      applyBrand()
    }
  }

  return { name, color, phone, applyBrand, applyConfig, loadPublic, loadFromAdmin }
})
