export type StockStatus = 'available' | 'low_stock' | 'sold_out'
export type TimingMode = 'per_order' | 'fixed_time'

export interface MenuItem {
  id: string
  name: string
  category: 'main' | 'protein' | 'drink' | 'extra' | 'weekend_special'
  price: number
  description?: string
  imageUrl?: string
  stockStatus: StockStatus
  availableOnDays?: number[]
  sortOrder: number
  timingMode?: TimingMode
  prepMinutes?: number
  fixedReadyAt?: number
}

export interface OrderLineItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

export type OrderStatus =
  | 'awaiting_payment'
  | 'waiting'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type PaymentMethod = 'paystack' | 'manual_transfer'

export type PaymentStatus =
  | 'pending'
  | 'submitted'
  | 'paid'
  | 'rejected'

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  items: OrderLineItem[]
  total: number
  specialInstructions?: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentReference: string
  status: OrderStatus
  queuePosition: number
  createdAt: number
  updatedAt: number
  deliveredAt?: number
  /** The real moment payment was confirmed — for Paystack this is the same
   * instant as createdAt (paid immediately), but for a manual bank
   * transfer this is whenever the admin actually clicks Confirm Payment,
   * which could be minutes after the order was originally placed. The
   * kitchen clock counts down from THIS moment, not createdAt. */
  confirmedAt?: number
  /** The real moment this order was marked 'ready' — used to correct the
   * shared kitchen clock so later orders' countdowns reflect actual
   * kitchen speed, not just the original 11-minute prediction. */
  actualReadyAt?: number
}

export interface PublicQueueEntry {
  orderNumber: string
  displayName: string
  status: OrderStatus
  queuePosition: number
  createdAt: number
  items: OrderLineItem[]
  readyAt: number
}

export type PaymentSubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface PaymentSubmission {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  total: number
  items: OrderLineItem[]
  senderName: string
  notes?: string
  status: PaymentSubmissionStatus
  createdAt: number
  reviewedAt?: number
}

export interface OrderContact {
  phone: string
}

export interface DailyStats {
  date: string
  revenue: number
  totalOrders: number
  pending: number
  preparing: number
  ready: number
  completed: number
  cancelled: number
}

export interface AdminUser {
  uid: string
  email: string
}

export interface Review {
  id: string
  name: string
  rating: number
  comment: string
  createdAt: number
}
