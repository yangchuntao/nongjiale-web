import { applyBrandColor, normalizeHex } from '@nongjiale/shared'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '../api/client'
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

  /* 无需登录的公开配置：保证登录页与首次进入就有真实站名/品牌色 */
  async function loadPublic() {
    try {
      const data = await http.request<PublicConfigBody>('/api/config/public')
      const nextName = data?.siteName?.trim()
      const nextPhone = data?.contactPhone?.trim()
      const nextColor = normalizeHex(data?.brandColor ?? undefined)
      if (nextName) name.value = nextName
      if (nextPhone) phone.value = nextPhone
      if (nextColor) color.value = nextColor
    } catch {
      // 公开配置失败时保留环境变量占位，不写入假站点数据。
    } finally {
      applyBrand()
    }
  }

  return { name, color, phone, applyBrand, loadPublic }
})
