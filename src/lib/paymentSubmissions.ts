import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { Order, PaymentSubmission } from '../types'

const PAYMENT_SUBMISSIONS = 'paymentSubmissions'
const ORDERS = 'orders'

interface SubmitPaymentInput { order: Order; senderName: string; notes?: string }

export async function submitPaymentProof(input: SubmitPaymentInput): Promise<void> {
  const { order, senderName, notes } = input
  const submission: Omit<PaymentSubmission, 'id'> = {
    orderId: order.id, orderNumber: order.orderNumber, customerName: order.customerName, total: order.total, items: order.items,
    senderName: senderName.trim(), notes: notes?.trim() || '', status: 'pending', createdAt: Date.now(),
  }
  await addDoc(collection(db, PAYMENT_SUBMISSIONS), submission)
  await updateDoc(doc(db, ORDERS, order.id), { paymentStatus: 'submitted', paymentReference: senderName.trim(), updatedAt: Date.now() })
}

export function subscribeAllPaymentSubmissions(callback: (submissions: PaymentSubmission[]) => void): Unsubscribe {
  const q = query(collection(db, PAYMENT_SUBMISSIONS), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentSubmission, 'id'>) }))))
}

export async function approvePaymentSubmission(submission: PaymentSubmission): Promise<void> {
  await updateDoc(doc(db, PAYMENT_SUBMISSIONS, submission.id), { status: 'approved', reviewedAt: Date.now() })
  await updateDoc(doc(db, ORDERS, submission.orderId), { paymentStatus: 'paid', status: 'waiting', confirmedAt: Date.now(), updatedAt: Date.now() })
}

export async function rejectPaymentSubmission(submission: PaymentSubmission): Promise<void> {
  await updateDoc(doc(db, PAYMENT_SUBMISSIONS, submission.id), { status: 'rejected', reviewedAt: Date.now() })
  await updateDoc(doc(db, ORDERS, submission.orderId), { paymentStatus: 'rejected', updatedAt: Date.now() })
}
