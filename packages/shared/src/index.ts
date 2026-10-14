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
