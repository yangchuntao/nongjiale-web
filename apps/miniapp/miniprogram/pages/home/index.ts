import { openBannerLink } from '../../api/navigate'
import { callPhone, setListHandoff, toast } from '../../api/session'
import { fetchHomeBanners, fetchHomeFeed, fetchRegions } from '../../api/services'
import { bannerAlt, bannerFrame, classifyMiniBannerLink, visibleHomeBanners, type HomeBanner } from '../../domain/banners'
import { openCityRegions, type RegionItem } from '../../domain/regions'
import { priceLabel, visitorTags } from '../../domain/stores'
import { ensureSite } from '../../ui/site'

interface StoreView {
  id: number
  name: string
  regionName: string
  coverUrl: string
  price: string
  tags: string[]
}

interface ArticleView {
  id: number
  title: string
  summary: string
}

interface BannerView {
  id: string
  imageUrl: string
  alt: string
  linkUrl: string
  tappable: boolean
}

let regions: RegionItem[] | null = null

function presentBanner(banner: HomeBanner): BannerView {
  return {
    id: banner.id,
    imageUrl: banner.imageUrl,
    alt: bannerAlt(banner.title),
    linkUrl: banner.linkUrl,
    tappable: classifyMiniBannerLink(banner.linkUrl).kind !== 'ignore',
  }
}

Page({
  data: {
    loading: true,
    brandColor: '#4BA3D9',
    onBrand: '#1A1A1A',
    contactPhone: '',
    bannerFrame: 'hidden' as 'hidden' | 'still' | 'carousel',
    banners: [] as BannerView[],
    cities: [] as Array<{ id: number; name: string }>,
    stores: [] as StoreView[],
    articles: [] as ArticleView[],
    pageError: '',
  },

  onShow() {
    void this.load()
  },

  onPullDownRefresh() {
    void this.load().finally(() => wx.stopPullDownRefresh())
  },

  async load() {
    const site = await ensureSite()
    wx.setNavigationBarTitle({ title: site.siteName })
    const [bannersResult, regionsResult, feedResult] = await Promise.allSettled([
      fetchHomeBanners(),
      fetchRegions(),
      fetchHomeFeed(),
    ])

    const banners = bannersResult.status === 'fulfilled' ? visibleHomeBanners(bannersResult.value).map(presentBanner) : []
    regions = regionsResult.status === 'fulfilled' ? regionsResult.value : null
    const cities = openCityRegions(regions ?? []).map((item) => ({ id: item.id, name: item.name }))
    const stores =
      feedResult.status === 'fulfilled'
        ? feedResult.value.stores.map((store) => ({
            id: store.id,
            name: store.name,
            regionName: store.regionName,
            coverUrl: store.coverUrl,
            price: priceLabel(store.priceText, store.priceFrom),
            tags: visitorTags(store),
          }))
        : []
    const articles =
      feedResult.status === 'fulfilled'
        ? feedResult.value.articles.slice(0, 3).map((item) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
          }))
        : []
    const allFailed =
      bannersResult.status === 'rejected' && regionsResult.status === 'rejected' && feedResult.status === 'rejected'
    if (!allFailed && regionsResult.status === 'rejected') toast('加载异常')
    this.setData({
      loading: false,
      brandColor: site.brandColor,
      onBrand: site.onBrand,
      contactPhone: site.contactPhone,
      bannerFrame: bannerFrame(banners.length),
      banners,
      cities,
      stores,
      articles,
      pageError: allFailed ? '加载异常' : '',
    })
  },

  onBannerTap(event: WechatMiniprogram.BaseEvent) {
    const index = Number(event.currentTarget.dataset.index)
    const banner = this.data.banners[index]
    if (!banner?.tappable) return
    openBannerLink(banner.linkUrl, regions)
  },

  onFind() {
    wx.switchTab({ url: '/pages/list/index' })
  },

  onGuides() {
    wx.navigateTo({ url: '/pages/guides/index' })
  },

  onCall() {
    callPhone(this.data.contactPhone)
  },

  onCity(event: WechatMiniprogram.BaseEvent) {
    const regionId = Number(event.currentTarget.dataset.id)
    if (!Number.isFinite(regionId)) return
    setListHandoff({ regionId, keyword: '' })
    wx.switchTab({ url: '/pages/list/index' })
  },

  onStore(event: WechatMiniprogram.BaseEvent) {
    const id = Number(event.currentTarget.dataset.id)
    if (!Number.isFinite(id)) return
    wx.navigateTo({ url: `/pages/detail/index?id=${id}` })
  },

  onArticle(event: WechatMiniprogram.BaseEvent) {
    const id = Number(event.currentTarget.dataset.id)
    if (!Number.isFinite(id)) return
    wx.navigateTo({ url: `/pages/guides/detail?id=${id}` })
  },

  onRetry() {
    void this.load()
  },
})
