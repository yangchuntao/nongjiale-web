import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

const auth = useAuthStore()
window.addEventListener('merchant-must-change-password', () => {
  auth.markMustChangePassword()
  if (router.currentRoute.value.name !== 'change-password') {
    router.push({ name: 'change-password' })
  }
})

auth.hydrate().finally(() => {
  app.mount('#app')
})
