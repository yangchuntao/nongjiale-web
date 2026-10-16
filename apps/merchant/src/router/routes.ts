import type { RouteRecordRaw } from 'vue-router'
import IntentDetailView from '../views/IntentDetailView.vue'
import IntentListView from '../views/IntentListView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ShelfView from '../views/ShelfView.vue'
import StoreEditView from '../views/StoreEditView.vue'
import StoreListView from '../views/StoreListView.vue'

export const HOME_PATH = '/stores'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: HOME_PATH },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录', pageId: 'M-LOGIN', guestOnly: true },
  },
  {
    path: '/stores',
    name: 'stores',
    component: StoreListView,
    meta: { title: '门店', pageId: 'M-STORE-LIST', requiresAuth: true },
  },
  {
    path: '/stores/:id/shelf',
    name: 'store-shelf',
    component: ShelfView,
    meta: { title: '上下架申请', pageId: 'M-SHELF', requiresAuth: true },
  },
  {
    path: '/stores/:id',
    name: 'store-edit',
    component: StoreEditView,
    meta: { title: '门店编辑', pageId: 'M-STORE-EDIT', requiresAuth: true },
  },
  {
    path: '/intents',
    name: 'intents',
    component: IntentListView,
    meta: { title: '意向', pageId: 'M-INTENT-LIST', requiresAuth: true },
  },
  {
    path: '/intents/:id',
    name: 'intent-detail',
    component: IntentDetailView,
    meta: { title: '意向详情', pageId: 'M-INTENT-DETAIL', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '页面不存在', pageId: 'NOT-FOUND' },
  },
]
