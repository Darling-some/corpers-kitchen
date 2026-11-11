export type StockStatus = 'available' | 'low_stock' | 'sold_out'
export type TimingMode = 'per_order' | 'fixed_time'

export interface MenuItem {
  id: string
  name: string
  // 'special' = the day's special, flagged for ANY day the admin picks,
  // and always shown at the top of the menu.
  category: 'main' | 'protein' | 'drink' | 'extra' | 'special'
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
export interface OrderLineItem { menuItemId: string; name: string; price: number; quantity: number }
export type OrderStatus = 'awaiting_payment' | 'waiting' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type PaymentMethod = 'paystack' | 'manual_transfer'
export type PaymentStatus = 'pending' | 'submitted' | 'paid' | 'rejected'
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
  confirmedAt?: number
  actualReadyAt?: number
}
export interface PublicQueueEntry { orderNumber: string; displayName: string; status: OrderStatus; queuePosition: number; createdAt: number; items: OrderLineItem[]; readyAt: number }
export type PaymentSubmissionStatus = 'pending' | 'approved' | 'rejected'
export interface PaymentSubmission { id: string; orderId: string; orderNumber: string; customerName: string; total: number; items: OrderLineItem[]; senderName: string; notes?: string; status: PaymentSubmissionStatus; createdAt: number; reviewedAt?: number }
export interface Review { id: string; name: string; rating: number; comment: string; createdAt: number }
export interface ChatMessage { id: string; orderId: string; orderNumber: string; name: string; text: string; createdAt: number; isStaff: boolean }
export interface ChatMute { orderNumber: string; name: string; mutedAt: number }
