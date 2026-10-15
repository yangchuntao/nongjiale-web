export {
  ARTICLE_STATUS_LABEL,
  INTENT_STATUS_LABEL,
  LISTING_ACTION_LABEL,
  LISTING_STATE_LABEL,
  REVIEW_STATUS_LABEL,
  STORE_STATUS_LABEL,
  labelOf,
} from './labels'

export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

export type PageResult<T> = {
  items: T[]
  total: number
}

export type Region = {
  id: number
  slug: string
  name: string
}

export type HomestayCard = {
  id: number
  name: string
  address: string
  coverUrl: string | null
  salesCount: number
  priceFrom: number
  status: string
  regionId: number
  homeRecommended?: boolean
  homeRecommendSort?: number
}

export type HomestayRoom = {
  id: number
  name: string
  roomCount: number
  priceFrom: number
}

export type HomestayDetail = HomestayCard & {
  facilities?: string
  notice?: string
  rooms: HomestayRoom[]
  reviews: unknown[]
  nearby: unknown[]
  bookable: boolean
}

export type TouristUser = {
  userId: number
  phone: string
  displayName: string
}

export type LoginResult = TouristUser & {
  token: string
}

export type BookingIntentCreate = {
  homestayId: number
  checkIn: string
  checkOut: string
  guests: number
  travelMode?: string
  contactName: string
  contactPhone: string
}

export type BookingIntentResult = {
  intentId: number
  intentNo: string
  status: string
  contactPhone: string
}

export type ContactMessageCreate = {
  homestayId?: number
  content: string
  contactName: string
  contactPhone: string
}

export type AdminLoginResult = {
  token: string
  adminId: number
  username: string
  displayName: string
  role: string
}

export type AdminIntent = {
  id: number
  intentNo: string
  userId: number
  homestayId: number
  checkIn: string
  checkOut: string
  guests: number
  contactName: string
  contactPhone: string
  status: string
  version: number
  createdAt: string
  notes?: Array<{
    id: number
    adminId: number
    action: string
    note: string
    createdAt: string
  }>
}

export const INTENT_STATUSES = ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CLOSED'] as const

export type PublicConfig = {
  siteName?: string
  primaryColor?: string
  contactPhone?: string
}

export type Article = {
  id: number
  title: string
  coverUrl?: string | null
  summary?: string
  body?: string
  status?: string
  publishedAt?: string | null
  createdAt?: string
}

export type ArticleWrite = {
  title: string
  coverUrl?: string | null
  summary?: string
  body?: string
}

export type MyIntent = {
  id: number
  intentNo: string
  homestayId: number
  homestayName?: string
  checkIn: string
  checkOut: string
  guests: number
  status: string
  createdAt?: string
}

export type MyIntentDetail = MyIntent & {
  contactName?: string
  contactPhone?: string
  travelMode?: string
}

export type MerchantApplicationWrite = {
  subjectName: string
  contactName: string
  phone: string
  proposedStoreName: string
  regionId: number
  description?: string
  licenseText?: string
  licenseImageUrls?: string[]
}

export type MerchantApplication = {
  id?: number
  applicationId?: number
  status: string
  rejectReason?: string | null
  createdAt?: string
  subjectName?: string
  contactName?: string
  phone?: string
  proposedStoreName?: string
  regionId?: number
  description?: string
  licenseText?: string
  licenseImageUrls?: string[]
  userId?: number
}

export type MerchantApplicationCreated = {
  applicationId: number
  status: string
}

export type MerchantApproved = {
  applicationId: number
  status: string
  merchantId: number
  loginPhone: string
  initialPassword: string
  mustChangePassword: boolean
}

export type MerchantAccount = {
  merchantId: number
  subjectName: string
  loginPhone: string
  enabled: boolean
  storeCount: number
}

export type MerchantPasswordReset = {
  initialPassword: string
  mustChangePassword: boolean
}

export type MerchantLoginResult = {
  token: string
  merchantUserId: number
  merchantId: number
  subjectName: string
  phone: string
  role: string
  mustChangePassword: boolean
}

export type MerchantProfile = Omit<MerchantLoginResult, 'token'>

export type MerchantDashboard = {
  storeCount: number
  pendingListingApplications: number
  newIntentCount: number
}

export type MerchantStore = {
  id: number
  merchantId?: number
  name: string
  regionId: number
  address?: string
  phone?: string
  summary?: string
  coverUrl?: string | null
  gallery?: string[]
  facilities?: string
  notice?: string
  traffic?: string
  surroundings?: string
  status: string
  listingStatus?: string
  priceFrom?: number
  salesCount?: number
  version: number
}

export type MerchantStoreWrite = {
  name: string
  regionId: number
  address?: string
  phone?: string
  summary?: string
  coverUrl?: string | null
  gallery?: string[]
  facilities?: string
  notice?: string
  traffic?: string
  surroundings?: string
  version?: number
}

export type StorePackage = {
  id: number
  storeId: number
  name: string
  description?: string
  priceFrom: number
  sortOrder?: number
}

export type StorePackageWrite = {
  name: string
  description?: string
  priceFrom: number
  sortOrder?: number
}

export type ListingApplication = {
  id: number
  storeId: number
  storeName?: string
  merchantId?: number
  subjectName?: string
  action: string
  status: string
  note?: string
  rejectReason?: string | null
  createdAt?: string
  reviewedAt?: string | null
}

export type MerchantIntent = {
  id: number
  intentNo: string
  storeId: number
  storeName?: string
  checkIn: string
  checkOut: string
  guests: number
  status: string
  contactName?: string
  contactPhoneMasked?: string
  noteSummary?: string
  createdAt?: string
}

export type AdminDashboard = {
  pendingIntents: number
  pendingMessages: number
  pendingMerchantApplications?: number
  pendingListingApplications?: number
}

export type SiteConfig = {
  siteName?: string
  primaryColor?: string
  contactPhone?: string
}

export function merchantApplicationId(row: { id?: number; applicationId?: number } | null | undefined) {
  if (!row) return undefined
  return row.applicationId ?? row.id
}
