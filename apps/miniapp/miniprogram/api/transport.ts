import { ApiError, type MiniRequest, type MiniResponse } from './http'

export function wxRequest(options: MiniRequest): Promise<MiniResponse> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      method: options.method as WechatMiniprogram.RequestOption['method'],
      header: options.header,
      timeout: 15000,
      ...(options.data === undefined ? {} : { data: options.data }),
      success: (res) => {
        resolve({ statusCode: res.statusCode, data: res.data })
      },
      fail: (err) => {
        reject(new ApiError(err.errMsg || '网络异常', -1, 0))
      },
    })
  })
}
