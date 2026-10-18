import { errorMessage, statusOf } from '../../api/errors'
import { fetchArticle } from '../../api/services'
import { articlePlainText } from '../../domain/stores'

Page({
  data: {
    loading: true,
    articleId: '',
    title: '',
    coverUrl: '',
    summary: '',
    content: '',
    error: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({ articleId: query.id || '' })
    void this.load()
  },

  onRetry() {
    void this.load()
  },

  async load() {
    if (!this.data.articleId) {
      this.setData({ loading: false, error: '加载失败，请重试' })
      return
    }
    this.setData({ loading: true, error: '' })
    try {
      const article = await fetchArticle(this.data.articleId)
      this.setData({
        loading: false,
        title: article.title,
        coverUrl: article.coverUrl,
        summary: article.summary,
        content: articlePlainText(article.content),
      })
      if (article.title) wx.setNavigationBarTitle({ title: article.title })
    } catch (error) {
      const missing = statusOf(error) === 404
      this.setData({
        loading: false,
        error: missing ? '攻略不存在' : errorMessage(error, '加载失败，请重试'),
      })
    }
  },
})
