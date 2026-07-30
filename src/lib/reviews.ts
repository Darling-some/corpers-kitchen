import { addDoc, collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { Review } from '../types'

const REVIEWS = 'reviews'

export async function submitReview(input: { name: string; rating: number; comment: string }): Promise<void> {
  const review: Omit<Review, 'id'> = { name: input.name.trim(), rating: input.rating, comment: input.comment.trim(), createdAt: Date.now() }
  await addDoc(collection(db, REVIEWS), review)
}

export function subscribeReviews(callback: (reviews: Review[]) => void): Unsubscribe {
  const q = query(collection(db, REVIEWS), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }))))
}
