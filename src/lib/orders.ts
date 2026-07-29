import {
  collection,
  doc,
  runTransaction,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { formatOrderNumber, todayDateKey, startOfTodayMillis } from '../utils/orderNumber'
import type { Order, OrderLineItem, OrderStatus, PublicQueueEntry } from '../types'

const ORDERS = 'orders'
const COUNTERS = 'counters'

type PaymentInput =
  | { method: 'paystack'; reference: string }
  | { method: 'manual_transfer' }

interface NewOrderInput {
  customerName: string
  phone: string
  items: OrderLineItem[]
  specialInstructions?: string
  payment: PaymentInput
}

const ACTIVE_STATUSES: OrderStatus[] = ['waiting', 'preparing', 'ready']

/**
 * Creates an order with a guaranteed-unique, human-readable order number
 * (CK-240724-001) using a Firestore transaction on a per-day counter
 * document, guarded against duplicate submissions via a per-session
 * idempotency key. Because the counter document is keyed by today's date,
 * numbering naturally restarts at 001 every new day — no manual reset or
 * scheduled job needed, and the date embedded in the number keeps every
 * order number unique forever even across different days.
 *
 * Two payment paths:
 *  - Paystack: the customer already paid before this is called (see
 *    Order.tsx) — the order is created already 'paid' and 'waiting', so it
 *    joins the live kitchen queue immediately.
 *  - Manual bank transfer: the order is created 'pending'/'awaiting_payment'
 *    — it does NOT enter the queue yet. It only moves to 'waiting' once the
 *    admin confirms the transfer in the Payments tab. The order number
 *    itself doubles as the transfer reference the customer includes in
 *    their bank app.
 */
export async function createOrder(input: NewOrderInput, clientRequestId: string): Promise<{ id: string; orderNumber: string }> {
  const dateKey = todayDateKey()
  const counterRef = doc(db, COUNTERS, dateKey)
  const idempotencyRef = doc(db, 'idempotency', clientRequestId)
  const newOrderRef = doc(collection(db, ORDERS))

  const total = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const orderNumber = await runTransaction(db, async (tx) => {
    const idemSnap = await tx.get(idempotencyRef)
    if (idemSnap.exists()) throw new Error('DUPLICATE_SUBMISSION')

    const counterSnap = await tx.get(counterRef)
    const next = (counterSnap.exists() ? (counterSnap.data().value as number) : 0) + 1

    tx.set(counterRef, { value: next }, { merge: true })
    tx.set(idempotencyRef, { orderId: newOrderRef.id, createdAt: serverTimestamp() })

    const orderNo = formatOrderNumber(dateKey, next)
    const paymentFields =
      input.payment.method === 'paystack'
        ? { paymentMethod: 'paystack' as const, paymentStatus: 'paid' as const, paymentReference: input.payment.reference, status: 'waiting' as const }
        : { paymentMethod: 'manual_transfer' as const, paymentStatus: 'pending' as const, paymentReference: '', status: 'awaiting_payment' as const }

    const order: Omit<Order, 'id'> = {
      orderNumber: orderNo,
      customerName: input.customerName.trim(),
      items: input.items,
      total,
      specialInstructions: input.specialInstructions?.trim() || '',
      queuePosition: next,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...paymentFields,
    }
    tx.set(newOrderRef, order)
    // Phone goes in a separate admin-only subcollection — the main order
    // doc is publicly readable (so the live queue and tracking page work
    // without login), but phone numbers should only ever be visible to
    // an admin, enforced by Firestore rules, not just by app UI convention.
    tx.set(doc(db, ORDERS, newOrderRef.id, 'private', 'contact'), { phone: input.phone.trim() })
    return orderNo
  })

  return { id: newOrderRef.id, orderNumber }
}

/** Admin-only, on-demand: fetches a single order's phone number right when
 * it's needed (e.g. the moment staff clicks "Call"), rather than bulk
 * loading every customer's number just to render a list. */
export async function fetchOrderPhone(orderId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, ORDERS, orderId, 'private', 'contact'))
  return snap.exists() ? (snap.data().phone as string) : null
}

/** Live-subscribes to every active (paid, not yet delivered/cancelled)
 * order from TODAY only, oldest first. Scoping to today means a leftover
 * order that was never finished the day before (e.g. a bank transfer that
 * was never confirmed) never lingers in the live queue or kitchen-clock
 * timing once a new day starts — it simply stops appearing here, though it
 * still exists in Firestore for the admin's own records if ever needed. */
export function subscribeActiveQueue(callback: (orders: Order[]) => void): Unsubscribe {
  const q = query(
    collection(db, ORDERS),
    where('status', 'in', ACTIVE_STATUSES),
    where('createdAt', '>=', startOfTodayMillis()),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) })))
  })
}

/** Derives the public-safe view of the queue — no phone numbers, ever. Ready
 * times are attached by the caller (see useQueue) since they require menu
 * context this module doesn't have. */
export function toPublicQueue(orders: Order[], readyTimes: Record<string, number>): PublicQueueEntry[] {
  return orders.map((o, index) => ({
    orderNumber: o.orderNumber,
    displayName: firstNameFrom(o.customerName),
    status: o.status,
    queuePosition: index + 1,
    createdAt: o.createdAt,
    items: o.items,
    readyAt: readyTimes[o.id] ?? o.createdAt,
  }))
}

function firstNameFrom(fullName: string): string {
  const trimmed = fullName.trim()
  return trimmed ? trimmed.split(/\s+/)[0] : 'Guest'
}

/** Live-subscribes to a single order by order number, for the tracking page. */
export function subscribeOrderByNumber(orderNumber: string, callback: (order: Order | null) => void): Unsubscribe {
  const q = query(collection(db, ORDERS), where('orderNumber', '==', orderNumber))
  return onSnapshot(q, (snap) => {
    if (snap.empty) { callback(null); return }
    const d = snap.docs[0]
    callback({ id: d.id, ...(d.data() as Omit<Order, 'id'>) })
  })
}

/** Admin: subscribes to every order today (Nigerian time) for the dashboard, most recent first. */
export function subscribeTodayOrders(callback: (orders: Order[]) => void): Unsubscribe {
  const q = query(collection(db, ORDERS), where('createdAt', '>=', startOfTodayMillis()), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) })))
  })
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const ref = doc(db, ORDERS, orderId)
  const patch: Record<string, unknown> = { status, updatedAt: Date.now() }
  if (status === 'delivered') patch.deliveredAt = Date.now()
  // Recording the real moment an order became ready lets the shared kitchen
  // clock correct itself for orders still waiting — if the kitchen finishes
  // faster (or slower) than the 11-minute prediction, everyone still in
  // line sees their countdown adjust to match reality instead of just
  // running on the original guess forever.
  if (status === 'ready') patch.actualReadyAt = Date.now()
  await updateDoc(ref, patch)
}

export function timestampToMillis(value: Timestamp | number | undefined): number {
  if (!value) return Date.now()
  return typeof value === 'number' ? value : value.toMillis()
}

/** One-time (non-live) fetch used by the analytics/reports tab and CSV export. */
export async function fetchOrdersInRange(startMillis: number, endMillis: number): Promise<Order[]> {
  const q = query(collection(db, ORDERS), where('createdAt', '>=', startMillis), where('createdAt', '<=', endMillis), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
}

/** Admin-only: bulk-fetches phone numbers for a set of orders, used only
 * when explicitly exporting a CSV report — not loaded for ordinary browsing
 * of the orders list. */
export async function fetchPhonesForOrders(orderIds: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    orderIds.map(async (id) => {
      const phone = await fetchOrderPhone(id)
      return [id, phone ?? ''] as const
    })
  )
  return Object.fromEntries(entries)
}
