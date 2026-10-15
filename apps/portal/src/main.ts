import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { setUnauthorizedHandler } from './api/client'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useSiteStore } from './stores/site'
import './styles/tokens.css'
import './styles/base.css'
import './styles/portal.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const auth = useAuthStore(pinia)
const site = useSiteStore(pinia)
auth.hydrate()
site.applyBrand()

setUnauthorizedHandler(() => {
  auth.logout()
  const current = router.currentRoute.value
  if (current.name === 'login') return
  void router.replace({
    path: '/login',
    query: { redirect: current.fullPath },
  })
})

void site.loadPublic().then(() => {
  if (typeof document === 'undefined') return
  const current = router.currentRoute.value
  const title = current.meta.title || '页面'
  document.title = `${title} · ${site.name}`
})
void auth.refreshProfile()

app.use(router)
app.mount('#app')
