import { defineStore } from 'pinia'
import { ref } from 'vue'
import { contactPhone, primaryColor, siteName } from '../env'

export const useSiteStore = defineStore('site', () => {
  const name = ref(siteName)
  const color = ref(primaryColor)
  const phone = ref(contactPhone)

  function applyBrand() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.style.setProperty('--color-brand', color.value)
    root.style.setProperty('--el-color-primary', color.value)
  }

  return { name, color, phone, applyBrand }
})
