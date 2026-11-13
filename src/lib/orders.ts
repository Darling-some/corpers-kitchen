import { collection, doc, onSnapshot, query, where, orderBy, updateDoc, getDocs, getDoc, type Unsubscribe } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import { db } from './firebase'
import { startOfTodayMillis } from '../utils/orderNumber'
import type { Order, OrderLineItem, OrderStatus, PublicQueueEntry } from '../types'

const ORDERS = 'orders'
type PaymentInput = { method: 'paystack'; reference: string } | { method: 'manual_transfer' }
interface NewOrderInput { customerName: string; phone: string; items: OrderLineItem[]; specialInstructions?: string; payment: PaymentInput }
const ACTIVE: OrderStatus[] = ['waiting', 'preparing', 'ready']
const mapDocs = (snap: { docs: { id: string; data: () => unknown }[] }) => snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))

export async function createOrder(input: NewOrderInput, clientRequestId: string): Promise<{ id: string; orderNumber: string; chatToken: string }> {
  const create = httpsCallable(functions, 'createOrder')
  const result = await create({
    customerName: input.customerName,
    phone: input.phone,
    items: input.items,
    specialInstructions: input.specialInstructions || '',
    payment: input.payment,
    clientRequestId,
  })
  return result.data as { id: string; orderNumber: string; chatToken: string }
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
