import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    {
      path: '/',
      component: () => import('../views/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'intents', name: 'intents', component: () => import('../views/IntentsView.vue') },
        { path: 'intents/:id', name: 'intent-detail', component: () => import('../views/IntentDetailView.vue') },
        { path: 'homestays', name: 'homestays', component: () => import('../views/HomestaysView.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.name === 'login' && auth.isLoggedIn) return { name: 'dashboard' }
  return true
})

export default router
