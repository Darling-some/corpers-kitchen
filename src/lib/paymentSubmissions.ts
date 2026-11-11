import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { Order, PaymentSubmission } from '../types'
export async function submitPaymentProof(i: { order: Order; senderName: string; notes?: string }): Promise<void> {
  const s: Omit<PaymentSubmission, 'id'> = { orderId: i.order.id, orderNumber: i.order.orderNumber, customerName: i.order.customerName, total: i.order.total, items: i.order.items, senderName: i.senderName.trim(), notes: i.notes?.trim() || '', status: 'pending', createdAt: Date.now() }
  await addDoc(collection(db, 'paymentSubmissions'), s)
  await updateDoc(doc(db, 'orders', i.order.id), { paymentStatus: 'submitted', paymentReference: i.senderName.trim(), updatedAt: Date.now() })
}
export function subscribeAllPaymentSubmissions(cb: (s: PaymentSubmission[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'paymentSubmissions'), orderBy('createdAt', 'desc')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentSubmission, 'id'>) }))))
}
export async function approvePaymentSubmission(s: PaymentSubmission): Promise<void> {
  await updateDoc(doc(db, 'paymentSubmissions', s.id), { status: 'approved', reviewedAt: Date.now() })
  await updateDoc(doc(db, 'orders', s.orderId), { paymentStatus: 'paid', status: 'waiting', confirmedAt: Date.now(), updatedAt: Date.now() })
}
export async function rejectPaymentSubmission(s: PaymentSubmission): Promise<void> {
  await updateDoc(doc(db, 'paymentSubmissions', s.id), { status: 'rejected', reviewedAt: Date.now() })
  await updateDoc(doc(db, 'orders', s.orderId), { paymentStatus: 'rejected', updatedAt: Date.now() })
}
