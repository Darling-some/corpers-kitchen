import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'

const SETTINGS = 'settings'
const ORDERING_DOC = 'ordering'
const PAYMENTS_DOC = 'payments'

interface OrderingSettings {
  isOpen: boolean
  updatedAt: number
}

interface PaymentSettings {
  paystackEnabled: boolean
  updatedAt: number
}

/** Live-subscribes to whether ordering is currently open. Defaults to
 * closed until the admin has explicitly opened it at least once — a shop
 * that's never touched this toggle shouldn't accidentally accept orders. */
export function subscribeOrderingStatus(callback: (isOpen: boolean) => void): Unsubscribe {
  return onSnapshot(doc(db, SETTINGS, ORDERING_DOC), (snap) => {
    const data = snap.data() as OrderingSettings | undefined
    callback(data?.isOpen ?? false)
  })
}

/** Admin-only: flips ordering open or closed, effective instantly for every visitor. */
export async function setOrderingOpen(isOpen: boolean): Promise<void> {
  await setDoc(doc(db, SETTINGS, ORDERING_DOC), { isOpen, updatedAt: Date.now() })
}

/** Live-subscribes to whether Paystack (online payment) is enabled. Starts
 * disabled until the admin turns it on — e.g. once their Paystack account
 * is fully verified — so the site can launch safely with Bank Transfer
 * only in the meantime. */
export function subscribePaystackEnabled(callback: (enabled: boolean) => void): Unsubscribe {
  return onSnapshot(doc(db, SETTINGS, PAYMENTS_DOC), (snap) => {
    const data = snap.data() as PaymentSettings | undefined
    callback(data?.paystackEnabled ?? false)
  })
}

/** Admin-only: turns online payment (Paystack) on or off, effective instantly. */
export async function setPaystackEnabled(enabled: boolean): Promise<void> {
  await setDoc(doc(db, SETTINGS, PAYMENTS_DOC), { paystackEnabled: enabled, updatedAt: Date.now() })
}
