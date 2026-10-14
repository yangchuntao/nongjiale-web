import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useConfigStore } from './stores/config'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const auth = useAuthStore()
const config = useConfigStore()
Promise.all([auth.hydrate(), config.load()]).finally(() => {
  app.mount('#app')
})
