import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('../views/ChangePasswordView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      component: () => import('../views/MerchantLayout.vue'),
      meta: { requiresAuth: true, requiresPasswordChanged: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'stores', name: 'stores', component: () => import('../views/StoresView.vue') },
        { path: 'stores/new', name: 'store-new', component: () => import('../views/StoreEditView.vue') },
        { path: 'stores/:id', name: 'store-edit', component: () => import('../views/StoreEditView.vue') },
        {
          path: 'listing-applications',
          name: 'listing-applications',
          component: () => import('../views/ListingApplicationsView.vue'),
        },
        { path: 'intents', name: 'intents', component: () => import('../views/IntentsView.vue') },
        { path: 'intents/:id', name: 'intent-detail', component: () => import('../views/IntentDetailView.vue') },
        { path: 'account', name: 'account', component: () => import('../views/AccountView.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const needsAuth = to.matched.some((record) => record.meta.requiresAuth)
  if (needsAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isLoggedIn) {
    return auth.mustChangePassword ? { name: 'change-password' } : { name: 'dashboard' }
  }
  const locked = to.matched.some((record) => record.meta.requiresPasswordChanged)
  if (locked && auth.mustChangePassword) return { name: 'change-password' }
  return true
})

export default router
