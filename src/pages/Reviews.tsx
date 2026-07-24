import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Loader2, Send } from 'lucide-react'
import { subscribeReviews, submitReview } from '../lib/reviews'
import type { Review } from '../types'

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n === 1 ? '' : 's'}`}>
          <Star size={24} className={n <= value ? 'fill-gold-400 text-gold-400' : 'text-ink-600'} />
        </button>
      ))}
    </div>
  )
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const unsub = subscribeReviews((next) => { setReviews(next); setLoading(false) })
    return unsub
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!comment.trim()) { setError('Please write a short review.'); return }
    setError('')
    setSubmitting(true)
    try {
      await submitReview({ name, rating, comment })
      setName(''); setComment(''); setRating(5)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 4000)
    } catch {
      setError('Something went wrong submitting your review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <span className="eyebrow">Reviews</span>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">What corp members are saying</h1>
      <p className="mt-2 text-bone-400">Leave a review of your own, or read what others have shared.</p>

      <div className="glass-card mt-8 p-6">
        <h2 className="mb-4 font-display text-lg font-medium">Write a Review</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-bone-400">Your Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="e.g. Amaka, Batch 24" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-bone-400">Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-bone-400">Your Review</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="Tell others what you thought…" />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          {submitted && <p className="text-sm text-success">Thanks for your review!</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-lg font-medium">All Reviews</h2>
        {loading && (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        )}
        {!loading && reviews.length === 0 && <p className="text-bone-400">No reviews yet — be the first to write one.</p>}
        <div className="space-y-3">
          {reviews.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">{r.name}</p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} className={i < r.rating ? 'fill-gold-400 text-gold-400' : 'text-ink-600'} />)}
                </div>
              </div>
              <p className="text-sm text-bone-200/85">{r.comment}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
