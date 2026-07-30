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
        ? { paymentMethod: 'paystack' as const, paymentStatus: 'paid' as const, paymentReference: input.payment.reference, status: 'waiting' as const, confirmedAt: Date.now() }
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
    tx.set(doc(db, ORDERS, newOrderRef.id, 'private', 'contact'), { phone: input.phone.trim() })
    return orderNo
  })

  return { id: newOrderRef.id, orderNumber }
}

export async function fetchOrderPhone(orderId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, ORDERS, orderId, 'private', 'contact'))
  return snap.exists() ? (snap.data().phone as string) : null
}

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

export function subscribeOrderByNumber(orderNumber: string, callback: (order: Order | null) => void): Unsubscribe {
  const q = query(collection(db, ORDERS), where('orderNumber', '==', orderNumber))
  return onSnapshot(q, (snap) => {
    if (snap.empty) { callback(null); return }
    const d = snap.docs[0]
    callback({ id: d.id, ...(d.data() as Omit<Order, 'id'>) })
  })
}

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
  if (status === 'ready') patch.actualReadyAt = Date.now()
  await updateDoc(ref, patch)
}

export function timestampToMillis(value: Timestamp | number | undefined): number {
  if (!value) return Date.now()
  return typeof value === 'number' ? value : value.toMillis()
}

export async function fetchOrdersInRange(startMillis: number, endMillis: number): Promise<Order[]> {
  const q = query(collection(db, ORDERS), where('createdAt', '>=', startMillis), where('createdAt', '<=', endMillis), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
}

export async function fetchPhonesForOrders(orderIds: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    orderIds.map(async (id) => {
      const phone = await fetchOrderPhone(id)
      return [id, phone ?? ''] as const
    })
  )
  return Object.fromEntries(entries)
}
