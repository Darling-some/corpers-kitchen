import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import { SEED_MENU } from '../data/menu'
import type { MenuItem, StockStatus } from '../types'

const MENU_ITEMS = 'menuItems'

export function subscribeMenu(callback: (items: MenuItem[]) => void): Unsubscribe {
  const q = query(collection(db, MENU_ITEMS), orderBy('sortOrder', 'asc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MenuItem, 'id'>) }))))
}

export async function setStockStatus(itemId: string, stockStatus: StockStatus): Promise<void> {
  await updateDoc(doc(db, MENU_ITEMS, itemId), { stockStatus })
}

export async function upsertMenuItem(item: MenuItem): Promise<void> {
  await setDoc(doc(db, MENU_ITEMS, item.id), item, { merge: true })
}

export async function createMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
  const ref = doc(collection(db, MENU_ITEMS))
  await setDoc(ref, item)
  return ref.id
}

export async function deleteMenuItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, MENU_ITEMS, itemId))
}

export async function seedMenuIfEmpty(existing: MenuItem[]): Promise<void> {
  if (existing.length > 0) return
  const batch = writeBatch(db)
  SEED_MENU.forEach((item) => { const ref = doc(collection(db, MENU_ITEMS)); batch.set(ref, item) })
  await batch.commit()
}
