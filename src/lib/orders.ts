import { collection, doc, runTransaction, onSnapshot, query, where, orderBy, updateDoc, serverTimestamp, getDocs, getDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import { formatOrderNumber, todayDateKey, startOfTodayMillis } from '../utils/orderNumber'
import { MIN_ORDER_TOTAL } from '../utils/orderRules'
import type { Order, OrderLineItem, OrderStatus, PublicQueueEntry } from '../types'

const ORDERS = 'orders'
type PaymentInput = { method: 'paystack'; reference: string } | { method: 'manual_transfer' }
interface NewOrderInput { customerName: string; phone: string; items: OrderLineItem[]; specialInstructions?: string; payment: PaymentInput }
const ACTIVE: OrderStatus[] = ['waiting', 'preparing', 'ready']
const mapDocs = (snap: { docs: { id: string; data: () => unknown }[] }) => snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))

export async function createOrder(input: NewOrderInput, clientRequestId: string): Promise<{ id: string; orderNumber: string }> {
  const total = input.items.reduce((s, i) => s + i.price * i.quantity, 0)
  if (total < MIN_ORDER_TOTAL) throw new Error('BELOW_MINIMUM_ORDER')
  const dateKey = todayDateKey()
  const counterRef = doc(db, 'counters', dateKey)
  const idemRef = doc(db, 'idempotency', clientRequestId)
  const newRef = doc(collection(db, ORDERS))
  const orderNumber = await runTransaction(db, async (tx) => {
    if ((await tx.get(idemRef)).exists()) throw new Error('DUPLICATE_SUBMISSION')
    const cs = await tx.get(counterRef)
    const next = (cs.exists() ? (cs.data().value as number) : 0) + 1
    tx.set(counterRef, { value: next }, { merge: true })
    tx.set(idemRef, { orderId: newRef.id, createdAt: serverTimestamp() })
    const orderNo = formatOrderNumber(dateKey, next)
    const pay = input.payment.method === 'paystack'
      ? { paymentMethod: 'paystack' as const, paymentStatus: 'paid' as const, paymentReference: input.payment.reference, status: 'waiting' as const, confirmedAt: Date.now() }
      : { paymentMethod: 'manual_transfer' as const, paymentStatus: 'pending' as const, paymentReference: '', status: 'awaiting_payment' as const }
    const order: Omit<Order, 'id'> = { orderNumber: orderNo, customerName: input.customerName.trim(), items: input.items, total, specialInstructions: input.specialInstructions?.trim() || '', queuePosition: next, createdAt: Date.now(), updatedAt: Date.now(), ...pay }
    tx.set(newRef, order)
    tx.set(doc(db, ORDERS, newRef.id, 'private', 'contact'), { phone: input.phone.trim() })
    return orderNo
  })
  return { id: newRef.id, orderNumber }
}
export async function fetchOrderPhone(orderId: string): Promise<string | null> {
  const s = await getDoc(doc(db, ORDERS, orderId, 'private', 'contact'))
  return s.exists() ? (s.data().phone as string) : null
}
export function subscribeActiveQueue(cb: (o: Order[]) => void): Unsubscribe {
  const q = query(collection(db, ORDERS), where('status', 'in', ACTIVE), where('createdAt', '>=', startOfTodayMillis()), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (s) => cb(mapDocs(s)))
}
export function toPublicQueue(orders: Order[], ready: Record<string, number>): PublicQueueEntry[] {
  return orders.map((o, i) => ({ orderNumber: o.orderNumber, displayName: o.customerName.trim().split(/\s+/)[0] || 'Guest', status: o.status, queuePosition: i + 1, createdAt: o.createdAt, items: o.items, readyAt: ready[o.id] ?? o.createdAt }))
}
export function subscribeOrderByNumber(n: string, cb: (o: Order | null) => void): Unsubscribe {
  return onSnapshot(query(collection(db, ORDERS), where('orderNumber', '==', n)), (s) => cb(s.empty ? null : mapDocs(s)[0]))
}
export function subscribeTodayOrders(cb: (o: Order[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, ORDERS), where('createdAt', '>=', startOfTodayMillis()), orderBy('createdAt', 'desc')), (s) => cb(mapDocs(s)))
}
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const patch: Record<string, unknown> = { status, updatedAt: Date.now() }
  if (status === 'delivered') patch.deliveredAt = Date.now()
  if (status === 'ready') patch.actualReadyAt = Date.now()
  await updateDoc(doc(db, ORDERS, id), patch)
}
export async function fetchOrdersInRange(a: number, b: number): Promise<Order[]> {
  return mapDocs(await getDocs(query(collection(db, ORDERS), where('createdAt', '>=', a), where('createdAt', '<=', b), orderBy('createdAt', 'asc'))))
}
export async function fetchPhonesForOrders(ids: string[]): Promise<Record<string, string>> {
  return Object.fromEntries(await Promise.all(ids.map(async (id) => [id, (await fetchOrderPhone(id)) ?? ''] as const)))
}
