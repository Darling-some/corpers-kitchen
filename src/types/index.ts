// Core domain types for Corpers Kitchen

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
  /** Only shown on these ISO weekday numbers (0 = Sunday .. 6 = Saturday). Omit for every-day items. */
  availableOnDays?: number[]
  sortOrder: number
  /**
   * 'per_order' (default): cooked to order — ready time counts up automatically
   * from a single running kitchen clock shared by every per-order item
   * (e.g. Noodles, Potatoes).
   * 'fixed_time': cooked in a batch/pot — the admin sets the exact clock time
   * it'll be ready, and every order of that item shows that same time
   * (e.g. Jollof Rice, Spaghetti). Updated whenever a new pot starts.
   */
  timingMode?: TimingMode
  /** Only used when timingMode is 'per_order'. Minutes to cook one order of this item. Defaults to 11. */
  prepMinutes?: number
  /** Only used when timingMode is 'fixed_time'. Epoch millis for when the current batch will be ready. */
  fixedReadyAt?: number
}

export interface OrderLineItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

export type OrderStatus =
  | 'awaiting_payment' // order just created, waiting on manual bank transfer proof
  | 'waiting' // payment confirmed — now in the live kitchen queue
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type PaymentMethod = 'paystack' | 'manual_transfer'

export type PaymentStatus =
  | 'pending' // manual transfer chosen, no proof submitted yet
  | 'submitted' // customer submitted proof — awaiting admin review
  | 'paid' // confirmed paid (instantly for Paystack, or admin-approved for manual transfer)
  | 'rejected' // admin rejected the submitted proof — customer can submit again

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  items: OrderLineItem[]
  total: number
  specialInstructions?: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  /** Paystack transaction reference, or the customer's own bank transfer
   * reference once submitted for manual payments. */
  paymentReference: string
  status: OrderStatus
  queuePosition: number
  createdAt: number
  updatedAt: number
  deliveredAt?: number
}

/** Shape of the data that is safe to broadcast on the public live-queue view. */
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

/** A customer's claim of having paid by bank transfer — created when they
 * submit the sender name they used. No receipt upload is required: the
 * admin checks their own bank alert for a matching name and amount, then
 * approves from the Payments tab. Order details are copied in at
 * submission time so that tab needs no extra lookups. */
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

/** Stored at orders/{orderId}/private/contact — kept out of the main order
 * document (which is publicly readable so the live queue and tracking page
 * work without login) so phone numbers are actually admin-only at the
 * database level, not just hidden by app UI convention. */
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
