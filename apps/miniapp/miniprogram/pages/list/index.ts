import { errorMessage } from '../../api/errors'
import { consumeListHandoff, toast } from '../../api/session'
import { fetchRegions, fetchStores } from '../../api/services'
import { CLOSED_DESTINATION_HINT } from '../../config'
import { openCityRegions, type RegionItem } from '../../domain/regions'
import { listEmptyCopy, priceLabel, storeListQuery, visitorTags } from '../../domain/stores'
import { ensureSite } from '../../ui/site'

interface StoreView {
  id: number
  name: string
  regionName: string
  coverUrl: string
  price: string
  tags: string[]
}

let loaded = 0

Page({
  data: {
    brandColor: '#4BA3D9',
    onBrand: '#1A1A1A',
    loading: true,
    loadingMore: false,
    cities: [] as Array<{ id: number; name: string }>,
    regionId: 0,
    keyword: '',
    draftKeyword: '',
    stores: [] as StoreView[],
    pageNo: 1,
    hasMore: false,
    closed: false,
    closedHint: CLOSED_DESTINATION_HINT,
    emptyText: '该市暂无上架农家乐',
    error: '',
  },

  onShow() {
    const handoff = consumeListHandoff()
    if (handoff) {
      this.setData({
        regionId: handoff.regionId ?? 0,
        keyword: handoff.keyword,
        draftKeyword: handoff.keyword,
      })
    }
    void this.reload(true)
  },

  onPullDownRefresh() {
    void this.reload(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.loading || this.data.loadingMore || !this.data.hasMore || this.data.closed) return
    void this.reload(false)
  },

  onKeywordInput(event: WechatMiniprogram.Input) {
    this.setData({ draftKeyword: event.detail.value })
  },

  onSearch() {
    const keyword = this.data.draftKeyword.trim()
    if ([...keyword].length > 64) {
      toast('参数不正确')
      return
    }
    this.setData({ keyword })
    void this.reload(true)
  },

  onCity(event: WechatMiniprogram.BaseEvent) {
    const regionId = Number(event.currentTarget.dataset.id)
    if (!Number.isFinite(regionId)) return
    this.setData({ regionId })
    void this.reload(true)
  },

  onStore(event: WechatMiniprogram.BaseEvent) {
    const id = Number(event.currentTarget.dataset.id)
    if (!Number.isFinite(id)) return
    wx.navigateTo({ url: `/pages/detail/index?id=${id}` })
  },

  onRetry() {
    void this.reload(true)
  },

  async reload(reset: boolean) {
    if (!reset && (this.data.loadingMore || !this.data.hasMore)) return
    const pageNo = reset ? 1 : this.data.pageNo + 1
    const built = storeListQuery({
      regionId: this.data.regionId > 0 ? this.data.regionId : null,
      keyword: this.data.keyword,
      page: pageNo,
    })
    if (!built.ok) {
      toast(built.message)
      return
    }
    this.setData(reset ? { loading: true, error: '', closed: false } : { loadingMore: true })
    try {
      if (reset) {
        const site = await ensureSite()
        const regionItems = await fetchRegions()
        const cities = openCities(regionItems)
        this.setData({
          brandColor: site.brandColor,
          onBrand: site.onBrand,
          cities,
        })
      }
      const result = await fetchStores(built.query)
      if (result.destinationStatus === 'CLOSED') {
        loaded = 0
        this.setData({
          loading: false,
          loadingMore: false,
          closed: true,
          closedHint: result.emptyHint || CLOSED_DESTINATION_HINT,
          stores: [],
          hasMore: false,
          pageNo: 1,
        })
        return
      }
      const incoming: StoreView[] = result.items.map((store) => ({
        id: store.id,
        name: store.name,
        regionName: store.regionName,
        coverUrl: store.coverUrl,
        price: priceLabel(store.priceText, store.priceFrom),
        tags: visitorTags(store),
      }))
      const stores = reset ? incoming : this.data.stores.concat(incoming)
      loaded = stores.length
      this.setData({
        loading: false,
        loadingMore: false,
        error: '',
        closed: false,
        stores,
        pageNo,
        hasMore: incoming.length > 0 && loaded < result.total,
        emptyText: listEmptyCopy(this.data.keyword),
      })
    } catch (error) {
      this.setData({
        loading: false,
        loadingMore: false,
        error: errorMessage(error, '列表加载失败，请重试'),
      })
    }
  },
})

function openCities(items: RegionItem[]): Array<{ id: number; name: string }> {
  return openCityRegions(items).map((item) => ({ id: item.id, name: item.name }))
}
