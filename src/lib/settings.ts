import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'

const SETTINGS = 'settings'
const ORDERING_DOC = 'ordering'
const PAYMENTS_DOC = 'payments'
const BANK_ACCOUNTS_DOC = 'bankAccounts'

interface OrderingSettings { isOpen: boolean; updatedAt: number }
interface PaymentSettings { paystackEnabled: boolean; updatedAt: number }
interface BankAccountsSettings { disabledLabels?: string[]; updatedAt: number }

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

/** A bank account is enabled unless its label appears in `disabledLabels`
 * — so a brand-new account added to bankDetails.ts is enabled by default
 * without needing any Firestore setup first. */
export function subscribeDisabledBankAccounts(callback: (disabledLabels: string[]) => void): Unsubscribe {
  return onSnapshot(doc(db, SETTINGS, BANK_ACCOUNTS_DOC), (snap) => {
    const data = snap.data() as BankAccountsSettings | undefined
    callback(data?.disabledLabels ?? [])
  })
}

export async function setBankAccountEnabled(label: string, enabled: boolean, currentDisabled: string[]): Promise<void> {
  const next = enabled ? currentDisabled.filter((l) => l !== label) : [...new Set([...currentDisabled, label])]
  await setDoc(doc(db, SETTINGS, BANK_ACCOUNTS_DOC), { disabledLabels: next, updatedAt: Date.now() })
}
