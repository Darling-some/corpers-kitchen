import { addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, setDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { ChatMessage, ChatMute, Order } from '../types'

const MESSAGES = 'chatMessages'
const MUTES = 'chatMutes'

/** Only the latest 50 messages are ever loaded — keeps Firestore reads low. */
export function subscribeChatMessages(cb: (m: ChatMessage[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, MESSAGES), orderBy('createdAt', 'desc'), limit(50)), (s) =>
    cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) })).reverse()))
}
export async function sendChatMessage(order: Order, text: string): Promise<void> {
  const name = order.customerName.trim().split(/\s+/)[0].slice(0, 30) || 'Guest'
  await addDoc(collection(db, MESSAGES), { orderId: order.id, orderNumber: order.orderNumber, name, text: text.trim(), createdAt: Date.now(), isStaff: false })
}
export const sendStaffMessage = (text: string) => addDoc(collection(db, MESSAGES), { orderId: '', orderNumber: 'STAFF', name: 'Corpers Kitchen', text: text.trim(), createdAt: Date.now(), isStaff: true })
export const deleteChatMessage = (id: string) => deleteDoc(doc(db, MESSAGES, id))
export const muteChatUser = (orderNumber: string, name: string) => setDoc(doc(db, MUTES, orderNumber), { name, mutedAt: Date.now() })
export const unmuteChatUser = (orderNumber: string) => deleteDoc(doc(db, MUTES, orderNumber))
export function subscribeMutes(cb: (m: ChatMute[]) => void): Unsubscribe {
  return onSnapshot(collection(db, MUTES), (s) => cb(s.docs.map((d) => ({ orderNumber: d.id, ...(d.data() as Omit<ChatMute, 'orderNumber'>) }))))
}
