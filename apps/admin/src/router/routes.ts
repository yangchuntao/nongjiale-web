import type { RouteRecordRaw } from 'vue-router'
import ApplyCreateView from '../views/ApplyCreateView.vue'
import ApplyDetailView from '../views/ApplyDetailView.vue'
import AppliesView from '../views/AppliesView.vue'
import BannerEditView from '../views/BannerEditView.vue'
import BannerListView from '../views/BannerListView.vue'
import CitiesView from '../views/CitiesView.vue'
import CityDetailView from '../views/CityDetailView.vue'
import GuidesView from '../views/GuidesView.vue'
import SeedMetricsView from '../views/SeedMetricsView.vue'
import IntentDetailView from '../views/IntentDetailView.vue'
import IntentsView from '../views/IntentsView.vue'
import ListingEditView from '../views/ListingEditView.vue'
import ListingsView from '../views/ListingsView.vue'
import LoginView from '../views/LoginView.vue'
import MerchantsView from '../views/MerchantsView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ShelfQueueView from '../views/ShelfQueueView.vue'
import SiteConfigView from '../views/SiteConfigView.vue'

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
    component: AppliesView,
    meta: { title: '入驻申请', pageId: 'A-APPLY-QUEUE', requiresAuth: true },
  },
  {
    path: '/applies/new',
    name: 'apply-new',
    component: ApplyCreateView,
    meta: { title: '代录入驻', pageId: 'A-APPLY-CREATE', requiresAuth: true },
  },
  {
    path: '/applies/:id',
    name: 'apply-detail',
    component: ApplyDetailView,
    meta: { title: '入驻详情', pageId: 'A-APPLY-DETAIL', requiresAuth: true },
  },
  {
    path: '/merchants',
    name: 'merchants',
    component: MerchantsView,
    meta: { title: '商家', pageId: 'A-MERCHANT', requiresAuth: true },
  },
  {
    path: '/listings',
    name: 'listings',
    component: ListingsView,
    meta: { title: '房源', pageId: 'A-LISTING-LIST', requiresAuth: true },
  },
  {
    path: '/listings/:id',
    name: 'listing-edit',
    component: ListingEditView,
    meta: { title: '房源编辑', pageId: 'A-LISTING-EDIT', requiresAuth: true },
  },
  {
    path: '/shelf-requests',
    name: 'shelf-requests',
    component: ShelfQueueView,
    meta: { title: '上下架队列', pageId: 'A-SHELF-QUEUE', requiresAuth: true },
  },
  {
    path: '/intents',
    name: 'intents',
    component: IntentsView,
    meta: { title: '意向', pageId: 'A-INTENT-LIST', requiresAuth: true },
  },
  {
    path: '/intents/:id',
    name: 'intent-detail',
    component: IntentDetailView,
    meta: { title: '意向详情', pageId: 'A-INTENT-DETAIL', requiresAuth: true },
  },
  {
    path: '/guides/:id?',
    name: 'guides',
    component: GuidesView,
    meta: { title: '攻略', pageId: 'A-GUIDE-LIST', requiresAuth: true },
  },
  {
    path: '/banners',
    name: 'banners',
    component: BannerListView,
    meta: { title: 'Banner 管理', pageId: 'A-BANNER', requiresAuth: true },
  },
  {
    path: '/banners/new',
    name: 'banner-new',
    component: BannerEditView,
    meta: { title: '新建 Banner', pageId: 'A-BANNER-EDIT', requiresAuth: true },
  },
  {
    path: '/banners/:id',
    name: 'banner-edit',
    component: BannerEditView,
    meta: { title: '编辑 Banner', pageId: 'A-BANNER-EDIT', requiresAuth: true },
  },
  {
    path: '/cities',
    name: 'cities',
    component: CitiesView,
    meta: { title: '开城/目的地', pageId: 'A-CITY', requiresAuth: true },
  },
  {
    path: '/cities/:cityId',
    name: 'city-detail',
    component: CityDetailView,
    meta: { title: '单市开城', pageId: 'A-CITY-DETAIL', requiresAuth: true },
  },
  {
    path: '/seed-metrics',
    name: 'seed-metrics',
    component: SeedMetricsView,
    meta: { title: '种子看板', pageId: 'A-SEED', requiresAuth: true },
  },
  {
    path: '/site',
    name: 'site',
    component: SiteConfigView,
    meta: { title: '站点配置', pageId: 'A-SITE-CONFIG', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '页面不存在', pageId: 'NOT-FOUND' },
  },
]
