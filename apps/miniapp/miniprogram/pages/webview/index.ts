import { copyText, readWebviewEnabled, toast } from '../../api/session'

Page({
  data: {
    url: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const url = query.url ? decodeURIComponent(query.url) : ''
    if (!/^https?:\/\//i.test(url) || !readWebviewEnabled()) {
      if (/^https?:\/\//i.test(url)) {
        wx.showModal({
          title: '复制链接',
          content: url,
          confirmText: '复制链接',
          success: (res) => {
            if (res.confirm) copyText(url, '已复制，请到浏览器粘贴打开')
            wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/home/index' }) })
          },
        })
        return
      }
      toast('暂无法打开，请复制链接')
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/home/index' }) })
      return
    }
    this.setData({ url })
  },

  onFail() {
    const url = this.data.url
    toast('暂无法打开，请复制链接')
    if (url) copyText(url, '已复制，请到浏览器粘贴打开')
  },
})
