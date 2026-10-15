import type { RouteRecordRaw } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ShellView from '../views/ShellView.vue'

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
    component: ShellView,
    meta: { title: '门店', pageId: 'M-STORE-LIST', requiresAuth: true, hint: '门店列表脚手架。商家不能自建门店。' },
  },
  {
    path: '/stores/:id/shelf',
    name: 'store-shelf',
    component: ShellView,
    meta: {
      title: '上下架申请',
      pageId: 'M-SHELF',
      requiresAuth: true,
      hint: '上下架申请脚手架。申请不会直接改上架状态。',
    },
  },
  {
    path: '/stores/:id',
    name: 'store-edit',
    component: ShellView,
    meta: { title: '门店编辑', pageId: 'M-STORE-EDIT', requiresAuth: true, hint: '门店编辑脚手架。' },
  },
  {
    path: '/intents',
    name: 'intents',
    component: ShellView,
    meta: { title: '意向', pageId: 'M-INTENT-LIST', requiresAuth: true, hint: '本店意向脚手架。只读。' },
  },
  {
    path: '/intents/:id',
    name: 'intent-detail',
    component: ShellView,
    meta: { title: '意向详情', pageId: 'M-INTENT-DETAIL', requiresAuth: true, hint: '意向详情脚手架。只读。' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: ShellView,
    meta: { title: '页面不存在', pageId: 'NOT-FOUND', hint: '未匹配到已登记路由。' },
  },
]
