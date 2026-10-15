import type { RouteRecordRaw } from 'vue-router'
import GuideShell from '../views/GuideShell.vue'
import LoginView from '../views/LoginView.vue'
import ShellView from '../views/ShellView.vue'

export const HOME_PATH = '/applies'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: HOME_PATH },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录', pageId: 'A-LOGIN', guestOnly: true },
  },
  {
    path: '/applies',
    name: 'applies',
    component: ShellView,
    meta: { title: '入驻申请', pageId: 'A-APPLY-QUEUE', requiresAuth: true, hint: '入驻队列脚手架。' },
  },
  {
    path: '/applies/:id',
    name: 'apply-detail',
    component: ShellView,
    meta: { title: '入驻详情', pageId: 'A-APPLY-DETAIL', requiresAuth: true, hint: '入驻详情脚手架。' },
  },
  {
    path: '/merchants',
    name: 'merchants',
    component: ShellView,
    meta: { title: '商家', pageId: 'A-MERCHANT', requiresAuth: true, hint: '商家启停脚手架。无新建门店表单。' },
  },
  {
    path: '/listings',
    name: 'listings',
    component: ShellView,
    meta: { title: '房源', pageId: 'A-LISTING-LIST', requiresAuth: true, hint: '房源列表脚手架。' },
  },
  {
    path: '/listings/:id',
    name: 'listing-edit',
    component: ShellView,
    meta: { title: '房源编辑', pageId: 'A-LISTING-EDIT', requiresAuth: true, hint: '房源编辑脚手架。' },
  },
  {
    path: '/shelf-requests',
    name: 'shelf-requests',
    component: ShellView,
    meta: {
      title: '上下架队列',
      pageId: 'A-SHELF-QUEUE',
      requiresAuth: true,
      hint: '上下架审核脚手架。',
    },
  },
  {
    path: '/intents',
    name: 'intents',
    component: ShellView,
    meta: { title: '意向', pageId: 'A-INTENT-LIST', requiresAuth: true, hint: '意向跟进脚手架。' },
  },
  {
    path: '/intents/:id',
    name: 'intent-detail',
    component: ShellView,
    meta: { title: '意向详情', pageId: 'A-INTENT-DETAIL', requiresAuth: true, hint: '意向详情脚手架。' },
  },
  {
    path: '/guides/:id?',
    name: 'guides',
    component: GuideShell,
    meta: {
      title: '攻略',
      pageId: 'A-GUIDE-LIST',
      requiresAuth: true,
      hint: '无 id 为攻略列表，有 id 为攻略编辑。',
    },
  },
  {
    path: '/site',
    name: 'site',
    component: ShellView,
    meta: { title: '站点配置', pageId: 'A-SITE-CONFIG', requiresAuth: true, hint: '站点配置脚手架。' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: ShellView,
    meta: { title: '页面不存在', pageId: 'NOT-FOUND', hint: '未匹配到已登记路由。' },
  },
]
