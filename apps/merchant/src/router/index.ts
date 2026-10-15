import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'
import { installAuthGuard } from './guard'
import { HOME_PATH, routes } from './routes'

export function createAppRouter(history?: RouterHistory) {
  const router = createRouter({
    history: history ?? createWebHistory(import.meta.env.BASE_URL),
    routes,
  })
  installAuthGuard(router, HOME_PATH)
  return router
}

export default createAppRouter()
