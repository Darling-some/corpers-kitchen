import { addDoc, collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { Review } from '../types'
export const submitReview = (i: { name: string; rating: number; comment: string }) => addDoc(collection(db, 'reviews'), { name: i.name.trim(), rating: i.rating, comment: i.comment.trim(), createdAt: Date.now() })
export function subscribeReviews(cb: (r: Review[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }))))
}
