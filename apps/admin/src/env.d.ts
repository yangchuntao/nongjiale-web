/// <reference types="vite/client" />

export {}

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE?: string
    readonly VITE_SITE_NAME?: string
    readonly VITE_PRIMARY_COLOR?: string
    readonly VITE_CONTACT_PHONE?: string
    readonly VITE_USE_MOCK?: string
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    pageId: string
    hint?: string
    requiresAuth?: boolean
    guestOnly?: boolean
  }
}
