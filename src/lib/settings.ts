import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'

const SETTINGS = 'settings'
const ORDERING_DOC = 'ordering'
const PAYMENTS_DOC = 'payments'

interface OrderingSettings { isOpen: boolean; updatedAt: number }
interface PaymentSettings { paystackEnabled: boolean; updatedAt: number }

export function subscribeOrderingStatus(callback: (isOpen: boolean) => void): Unsubscribe {
  return onSnapshot(doc(db, SETTINGS, ORDERING_DOC), (snap) => {
    const data = snap.data() as OrderingSettings | undefined
    callback(data?.isOpen ?? false)
  })
}

export async function setOrderingOpen(isOpen: boolean): Promise<void> {
  await setDoc(doc(db, SETTINGS, ORDERING_DOC), { isOpen, updatedAt: Date.now() })
}

export function subscribePaystackEnabled(callback: (enabled: boolean) => void): Unsubscribe {
  return onSnapshot(doc(db, SETTINGS, PAYMENTS_DOC), (snap) => {
    const data = snap.data() as PaymentSettings | undefined
    callback(data?.paystackEnabled ?? false)
  })
}

export async function setPaystackEnabled(enabled: boolean): Promise<void> {
  await setDoc(doc(db, SETTINGS, PAYMENTS_DOC), { paystackEnabled: enabled, updatedAt: Date.now() })
}
