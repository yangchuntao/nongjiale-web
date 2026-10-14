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
        {
          path: 'merchant-applications',
          name: 'merchant-applications',
          component: () => import('../views/MerchantApplicationsView.vue'),
          meta: { operatorOnly: true },
        },
        {
          path: 'listing-applications',
          name: 'listing-applications',
          component: () => import('../views/ListingApplicationsView.vue'),
          meta: { operatorOnly: true },
        },
        {
          path: 'articles',
          name: 'articles',
          component: () => import('../views/ArticlesView.vue'),
          meta: { operatorOnly: true },
        },
        {
          path: 'merchants',
          name: 'merchants',
          component: () => import('../views/MerchantsView.vue'),
          meta: { operatorOnly: true },
        },
        {
          path: 'site-config',
          name: 'site-config',
          component: () => import('../views/SiteConfigView.vue'),
          meta: { operatorOnly: true },
        },
        { path: 'forbidden', name: 'forbidden', component: () => import('../views/ForbiddenView.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.name === 'login' && auth.isLoggedIn) return { name: 'dashboard' }
  if (to.matched.some((record) => record.meta.operatorOnly) && !auth.isOperator) return { name: 'forbidden' }
  return true
})

export default router
