import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/regions/:slug', name: 'region', component: () => import('../views/SearchView.vue') },
    { path: '/search', name: 'search', component: () => import('../views/SearchView.vue') },
    { path: '/homestays/:id', name: 'homestay', component: () => import('../views/HomestayDetailView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guest: true } },
    {
      path: '/homestays/:id/book',
      name: 'book',
      component: () => import('../views/BookView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/homestays/:id/contact',
      name: 'contact',
      component: () => import('../views/ContactView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/booking/success', name: 'booking-success', component: () => import('../views/BookingSuccessView.vue') },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
