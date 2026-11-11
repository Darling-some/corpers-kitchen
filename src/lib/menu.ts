import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import { SEED_MENU } from '../data/menu'
import type { MenuItem, StockStatus } from '../types'
const C = 'menuItems'
export function subscribeMenu(cb: (i: MenuItem[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, C), orderBy('sortOrder', 'asc')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MenuItem, 'id'>) }))))
}
export const setStockStatus = (id: string, stockStatus: StockStatus) => updateDoc(doc(db, C, id), { stockStatus })
export const upsertMenuItem = (item: MenuItem) => setDoc(doc(db, C, item.id), item, { merge: true })
export async function createMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> { const r = doc(collection(db, C)); await setDoc(r, item); return r.id }
export const deleteMenuItem = (id: string) => deleteDoc(doc(db, C, id))
export async function seedMenuIfEmpty(existing: MenuItem[]): Promise<void> {
  if (existing.length > 0) return
  const b = writeBatch(db)
  SEED_MENU.forEach((i) => b.set(doc(collection(db, C)), i))
  await b.commit()
}
