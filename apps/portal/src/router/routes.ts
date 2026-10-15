import type { RouteRecordRaw } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ShellView from '../views/ShellView.vue'

export const HOME_PATH = '/'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: ShellView,
    meta: {
      title: '首页',
      pageId: 'P-HOME',
      hint: '首页脚手架。站名、主色、客服电话使用环境变量占位，不请求业务接口。',
    },
  },
  {
    path: '/listings',
    name: 'listings',
    component: ShellView,
    meta: { title: '房源列表', pageId: 'P-LIST', hint: '房源列表脚手架。不填入假房源。' },
  },
  {
    path: '/listings/:id/intent',
    name: 'listing-intent',
    component: ShellView,
    meta: {
      title: '提交意向',
      pageId: 'P-INTENT-FORM',
      requiresAuth: true,
      hint: '提交意向脚手架。无支付、无锁房。',
    },
  },
  {
    path: '/listings/:id',
    name: 'listing-detail',
    component: ShellView,
    meta: { title: '房源详情', pageId: 'P-DETAIL', hint: '房源详情脚手架。' },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录', pageId: 'P-LOGIN', guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: ShellView,
    meta: {
      title: '注册',
      pageId: 'P-REGISTER',
      guestOnly: true,
      hint: '注册页脚手架。完整注册表单不在本期。',
    },
  },
  {
    path: '/intents/:id/success',
    name: 'intent-success',
    component: ShellView,
    meta: {
      title: '意向提交成功',
      pageId: 'P-INTENT-SUCCESS',
      requiresAuth: true,
      hint: '意向成功页脚手架。',
    },
  },
  {
    path: '/my/intents',
    name: 'my-intents',
    component: ShellView,
    meta: { title: '我的意向', pageId: 'P-MY-INTENTS', requiresAuth: true, hint: '我的意向脚手架。' },
  },
  {
    path: '/my/intents/:id',
    name: 'my-intent-detail',
    component: ShellView,
    meta: {
      title: '意向详情',
      pageId: 'P-MY-INTENT-DETAIL',
      requiresAuth: true,
      hint: '意向详情脚手架。游客只读。',
    },
  },
  {
    path: '/guides',
    name: 'guides',
    component: ShellView,
    meta: { title: '攻略', pageId: 'P-GUIDE-LIST', hint: '攻略列表脚手架。' },
  },
  {
    path: '/guides/:id',
    name: 'guide-detail',
    component: ShellView,
    meta: { title: '攻略详情', pageId: 'P-GUIDE-DETAIL', hint: '攻略详情脚手架。' },
  },
  {
    path: '/merchant/apply',
    name: 'merchant-apply',
    component: ShellView,
    meta: {
      title: '商家入驻申请',
      pageId: 'P-MERCHANT-APPLY',
      hint: '入驻申请脚手架。完整申请表不在本期。',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: ShellView,
    meta: { title: '页面不存在', pageId: 'NOT-FOUND', hint: '未匹配到已登记路由。' },
  },
]
