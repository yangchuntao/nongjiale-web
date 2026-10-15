import { applyBrandColor } from '@nongjiale/shared'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { contactPhone, primaryColor, siteName } from '../env'

export const useSiteStore = defineStore('site', () => {
  const name = ref(siteName)
  const color = ref(primaryColor)
  const phone = ref(contactPhone)

  function applyBrand() {
    applyBrandColor(color.value)
  }

  return { name, color, phone, applyBrand }
})
