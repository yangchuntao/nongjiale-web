import type { RouteRecordRaw } from 'vue-router'
import GuideDetailView from '../views/GuideDetailView.vue'
import GuidesView from '../views/GuidesView.vue'
import HomeView from '../views/HomeView.vue'
import IntentFormView from '../views/IntentFormView.vue'
import IntentSuccessView from '../views/IntentSuccessView.vue'
import ListingDetailView from '../views/ListingDetailView.vue'
import ListingsView from '../views/ListingsView.vue'
import LoginView from '../views/LoginView.vue'
import MerchantApplyView from '../views/MerchantApplyView.vue'
import MyIntentDetailView from '../views/MyIntentDetailView.vue'
import MyIntentsView from '../views/MyIntentsView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import RegisterView from '../views/RegisterView.vue'

export const HOME_PATH = '/'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView, meta: { title: '首页', pageId: 'P-HOME' } },
  { path: '/listings', name: 'listings', component: ListingsView, meta: { title: '找农家乐', pageId: 'P-LIST' } },
  {
    path: '/listings/:id/intent',
    name: 'listing-intent',
    component: IntentFormView,
    meta: { title: '提交意向', pageId: 'P-INTENT-FORM', requiresAuth: true },
  },
  {
    path: '/listings/:id',
    name: 'listing-detail',
    component: ListingDetailView,
    meta: { title: '房源详情', pageId: 'P-DETAIL' },
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
    component: RegisterView,
    meta: { title: '注册', pageId: 'P-REGISTER', guestOnly: true },
  },
  {
    path: '/intents/:id/success',
    name: 'intent-success',
    component: IntentSuccessView,
    meta: { title: '意向已提交', pageId: 'P-INTENT-SUCCESS', requiresAuth: true },
  },
  {
    path: '/my/intents',
    name: 'my-intents',
    component: MyIntentsView,
    meta: { title: '我的意向', pageId: 'P-MY-INTENTS', requiresAuth: true },
  },
  {
    path: '/my/intents/:id',
    name: 'my-intent-detail',
    component: MyIntentDetailView,
    meta: { title: '意向详情', pageId: 'P-MY-INTENT-DETAIL', requiresAuth: true },
  },
  { path: '/guides', name: 'guides', component: GuidesView, meta: { title: '攻略', pageId: 'P-GUIDE-LIST' } },
  {
    path: '/guides/:id',
    name: 'guide-detail',
    component: GuideDetailView,
    meta: { title: '攻略详情', pageId: 'P-GUIDE-DETAIL' },
  },
  {
    path: '/merchant/apply',
    name: 'merchant-apply',
    component: MerchantApplyView,
    meta: { title: '商家入驻申请', pageId: 'P-MERCHANT-APPLY' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '页面不存在', pageId: 'NOT-FOUND' },
  },
]
