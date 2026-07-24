import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { Order, PaymentSubmission } from '../types'

const PAYMENT_SUBMISSIONS = 'paymentSubmissions'
const ORDERS = 'orders'

interface SubmitPaymentInput {
  order: Order
  senderName: string
  notes?: string
}

/** Called from the "I Have Made Payment" form. No receipt upload — the
 * admin checks their own bank alert for a matching sender name and amount,
 * then approves from the Payments tab. Order details are copied in so that
 * tab needs no extra lookups. */
export async function submitPaymentProof(input: SubmitPaymentInput): Promise<void> {
  const { order, senderName, notes } = input

  const submission: Omit<PaymentSubmission, 'id'> = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    total: order.total,
    items: order.items,
    senderName: senderName.trim(),
    notes: notes?.trim() || '',
    status: 'pending',
    createdAt: Date.now(),
  }
  await addDoc(collection(db, PAYMENT_SUBMISSIONS), submission)

  await updateDoc(doc(db, ORDERS, order.id), {
    paymentStatus: 'submitted',
    paymentReference: senderName.trim(),
    updatedAt: Date.now(),
  })
}

export function subscribeAllPaymentSubmissions(callback: (submissions: PaymentSubmission[]) => void): Unsubscribe {
  const q = query(collection(db, PAYMENT_SUBMISSIONS), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentSubmission, 'id'>) })))
  })
}

/** Admin approves — order enters the live kitchen queue immediately. */
export async function approvePaymentSubmission(submission: PaymentSubmission): Promise<void> {
  await updateDoc(doc(db, PAYMENT_SUBMISSIONS, submission.id), { status: 'approved', reviewedAt: Date.now() })
  await updateDoc(doc(db, ORDERS, submission.orderId), { paymentStatus: 'paid', status: 'waiting', updatedAt: Date.now() })
}

/** Admin rejects — order stays out of the queue, but the customer can submit again. */
export async function rejectPaymentSubmission(submission: PaymentSubmission): Promise<void> {
  await updateDoc(doc(db, PAYMENT_SUBMISSIONS, submission.id), { status: 'rejected', reviewedAt: Date.now() })
  await updateDoc(doc(db, ORDERS, submission.orderId), { paymentStatus: 'rejected', updatedAt: Date.now() })
}
