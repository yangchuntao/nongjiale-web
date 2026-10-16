import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { setUnauthorizedHandler } from './api/client'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useSiteStore } from './stores/site'
import './styles/tokens.css'
import 'element-plus/dist/index.css'
import './styles/base.css'
import './styles/admin.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(ElementPlus, { locale: zhCn })

const auth = useAuthStore(pinia)
auth.hydrate()
const site = useSiteStore(pinia)
site.applyBrand()
if (auth.isAuthenticated) {
  void auth.refreshMe()
  void site.loadFromAdmin()
}

setUnauthorizedHandler(() => {
  auth.logout()
  const current = router.currentRoute.value
  if (current.name === 'login') return
  void router.replace({
    path: '/login',
    query: { redirect: current.fullPath },
  })
})

app.use(router)
app.mount('#app')
