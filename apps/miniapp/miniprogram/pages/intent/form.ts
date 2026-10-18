import { errorMessage, statusOf } from '../../api/errors'
import { replaceLogin } from '../../api/navigate'
import { applyHold, readStoredToken, toast } from '../../api/session'
import { createIntent, fetchMe, fetchStore, fetchWechatLink } from '../../api/services'
import { LISTING_GONE_MESSAGE, LISTING_MISSING_MESSAGE } from '../../config'
import { todayIso } from '../../domain/datetime'
import { buildCreateIntentBody, type IntentErrors } from '../../domain/intent'
import { holdAfterBind, intentPostBlock } from '../../domain/session'
import { canSubmitIntent, priceLabel } from '../../domain/stores'
import { ensureSite } from '../../ui/site'

Page({
  data: {
    loading: true,
    submitting: false,
    brandColor: '#4BA3D9',
    onBrand: '#1A1A1A',
    storeId: 0,
    storeName: '',
    price: '',
    packageText: '',
    today: '',
    checkIn: '',
    checkOut: '',
    nights: '',
    guests: '2',
    contactName: '',
    contactPhone: '',
    userRemark: '',
    errors: {} as IntentErrors,
    pageError: '',
    canSubmit: false,
    accountLinked: false,
    profilePhone: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const storeId = Number(query.listingId || query.id || '')
    this.setData({ storeId: Number.isFinite(storeId) ? storeId : 0, today: todayIso() })
  },

  onShow() {
    if (!readStoredToken()) {
      replaceLogin(`/pages/intent/form?listingId=${this.data.storeId || ''}`)
      return
    }
    void this.load()
  },

  onCheckIn(event: WechatMiniprogram.PickerChange) {
    this.setData({ checkIn: String(event.detail.value) })
  },

  onCheckOut(event: WechatMiniprogram.PickerChange) {
    this.setData({ checkOut: String(event.detail.value) })
  },

  onNights(event: WechatMiniprogram.Input) {
    this.setData({ nights: event.detail.value })
  },

  onGuests(event: WechatMiniprogram.Input) {
    this.setData({ guests: event.detail.value })
  },

  onName(event: WechatMiniprogram.Input) {
    this.setData({ contactName: event.detail.value })
  },

  onContactPhone(event: WechatMiniprogram.Input) {
    this.setData({ contactPhone: event.detail.value })
  },

  onRemark(event: WechatMiniprogram.Input) {
    this.setData({ userRemark: event.detail.value })
  },

  async load() {
    this.setData({ loading: true, pageError: '' })
    try {
      const site = await ensureSite()
      const link = await fetchWechatLink()
      if (!link.accountLinked) {
        applyHold(holdAfterBind(false, readStoredToken() || ''))
        this.setData({ loading: false, accountLinked: false, canSubmit: false })
        replaceLogin(`/pages/intent/form?listingId=${this.data.storeId || ''}`)
        return
      }
      const me = await fetchMe()
      const store = this.data.storeId ? await fetchStore(String(this.data.storeId)) : null
      const bookable = store ? canSubmitIntent(store.shelfStatus, false) : false
      this.setData({
        loading: false,
        brandColor: site.brandColor,
        onBrand: site.onBrand,
        accountLinked: true,
        profilePhone: me.phone || '',
        contactPhone: this.data.contactPhone || me.phone || '',
        storeName: store?.name || '',
        price: store ? priceLabel(store.priceText, store.priceFrom) : '',
        packageText: store?.packageText || '',
        canSubmit: bookable,
        pageError: store ? '' : LISTING_MISSING_MESSAGE,
      })
    } catch (error) {
      const status = statusOf(error)
      this.setData({
        loading: false,
        canSubmit: false,
        pageError: status === 404 ? LISTING_MISSING_MESSAGE : status === 410 ? LISTING_GONE_MESSAGE : errorMessage(error, '加载失败，请重试'),
      })
    }
  },

  async onSubmit() {
    if (this.data.submitting || !this.data.canSubmit) return
    const block = intentPostBlock(this.data.accountLinked, this.data.profilePhone)
    if (block) {
      this.setData({ pageError: block })
      return
    }
    const built = buildCreateIntentBody(
      this.data.storeId,
      {
        checkIn: this.data.checkIn,
        checkOut: this.data.checkOut,
        nights: this.data.nights,
        guests: this.data.guests,
        contactName: this.data.contactName,
        contactPhone: this.data.contactPhone,
        userRemark: this.data.userRemark,
      },
      this.data.today || todayIso(),
    )
    this.setData({ errors: built.errors })
    if (!built.body) return
    this.setData({ submitting: true })
    try {
      const intent = await createIntent(built.body)
      wx.redirectTo({
        url: `/pages/intent/success?id=${intent.id}&intentNo=${encodeURIComponent(intent.intentNo)}`,
      })
    } catch (error) {
      const status = statusOf(error)
      const message = errorMessage(error, '加载失败，请重试')
      this.setData({ submitting: false, pageError: status === 410 ? LISTING_GONE_MESSAGE : message })
      if (status === 409 || status === 400) toast(message)
    }
  },
})
