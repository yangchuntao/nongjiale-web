export interface NavItem {
  path: string
  label: string
}

export const navItems: NavItem[] = [
  { path: '/applies', label: '入驻申请' },
  { path: '/merchants', label: '商家' },
  { path: '/listings', label: '房源' },
  { path: '/shelf-requests', label: '上下架队列' },
  { path: '/intents', label: '意向' },
  { path: '/guides', label: '攻略' },
  { path: '/banners', label: '广告位' },
  { path: '/cities', label: '开城/目的地' },
  { path: '/seed-metrics', label: '种子看板' },
  { path: '/site', label: '站点配置' },
]
