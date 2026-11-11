import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
const S = 'settings'
const watch = <T,>(id: string, pick: (d: Record<string, unknown> | undefined) => T, cb: (v: T) => void): Unsubscribe =>
  onSnapshot(doc(db, S, id), (snap) => cb(pick(snap.data())))

export const subscribeOrderingStatus = (cb: (v: boolean) => void) => watch('ordering', (d) => (d?.isOpen as boolean) ?? false, cb)
export const setOrderingOpen = (isOpen: boolean) => setDoc(doc(db, S, 'ordering'), { isOpen, updatedAt: Date.now() })

export const subscribePaystackEnabled = (cb: (v: boolean) => void) => watch('payments', (d) => (d?.paystackEnabled as boolean) ?? false, cb)
export const setPaystackEnabled = (paystackEnabled: boolean) => setDoc(doc(db, S, 'payments'), { paystackEnabled, updatedAt: Date.now() })

export const subscribeDisabledBankAccounts = (cb: (v: string[]) => void) => watch('bankAccounts', (d) => (d?.disabledLabels as string[]) ?? [], cb)
export function setBankAccountEnabled(label: string, enabled: boolean, current: string[]) {
  const next = enabled ? current.filter((l) => l !== label) : [...new Set([...current, label])]
  return setDoc(doc(db, S, 'bankAccounts'), { disabledLabels: next, updatedAt: Date.now() })
}

// Waiting Room chat — starts OFF until the admin turns it on.
export const subscribeChatEnabled = (cb: (v: boolean) => void) => watch('chat', (d) => (d?.enabled as boolean) ?? false, cb)
export const setChatEnabled = (enabled: boolean) => setDoc(doc(db, S, 'chat'), { enabled, updatedAt: Date.now() })
export const subscribeChatAnnouncement = (cb: (v: string) => void) => watch('chatAnnouncement', (d) => (d?.text as string) ?? '', cb)
export const setChatAnnouncement = (text: string) => setDoc(doc(db, S, 'chatAnnouncement'), { text: text.trim(), updatedAt: Date.now() })
