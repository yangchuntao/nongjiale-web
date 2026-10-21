import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { createPinia } from 'pinia'
import { createApp, watch } from 'vue'
import { setUnauthorizedHandler } from './api/client'
import App from './App.vue'
import { currentPageTitle } from './router/guard'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useSiteStore } from './stores/site'
import './styles/tokens.css'
import 'element-plus/dist/index.css'
import './styles/base.css'
import './styles/merchant.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(ElementPlus, { locale: zhCn })

const auth = useAuthStore(pinia)
auth.hydrate()
const site = useSiteStore(pinia)
site.applyBrand()
// 站名经公开配置异步到达；到达后用当前页面标题重写 document.title
watch(
  () => site.name,
  () => {
    const title = currentPageTitle()
    if (title) document.title = `${title} · ${site.name}`
  },
)
void site.loadPublic()

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
