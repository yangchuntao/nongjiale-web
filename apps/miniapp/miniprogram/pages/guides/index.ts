import { fetchArticles } from '../../api/services'
import { PAGE_SIZE } from '../../config'

interface ArticleView {
  id: number
  title: string
  coverUrl: string
  summary: string
}

Page({
  data: {
    loading: true,
    error: false,
    items: [] as ArticleView[],
    pageNo: 1,
    hasMore: false,
  },

  onShow() {
    void this.reload(true)
  },

  onPullDownRefresh() {
    void this.reload(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    void this.reload(false)
  },

  onRetry() {
    void this.reload(true)
  },

  onOpen(event: WechatMiniprogram.BaseEvent) {
    const id = Number(event.currentTarget.dataset.id)
    if (!Number.isFinite(id)) return
    wx.navigateTo({ url: `/pages/guides/detail?id=${id}` })
  },

  async reload(reset: boolean) {
    const pageNo = reset ? 1 : this.data.pageNo + 1
    this.setData({ loading: reset, error: false })
    try {
      const page = await fetchArticles(pageNo)
      const incoming = page.items.map((item) => ({
        id: item.id,
        title: item.title,
        coverUrl: item.coverUrl,
        summary: item.summary,
      }))
      const items = reset ? incoming : this.data.items.concat(incoming)
      this.setData({
        loading: false,
        items,
        pageNo,
        hasMore: incoming.length >= PAGE_SIZE && items.length < page.total,
      })
    } catch {
      this.setData({ loading: false, error: true })
    }
  },
})
