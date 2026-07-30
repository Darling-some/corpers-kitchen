import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'

const REVIEWS = [
  { name: 'Adaeze, Batch 22', quote: 'The live queue means I actually know when to walk over instead of standing in the sun.', rating: 5 },
  { name: 'Chibuzor, Batch 22', quote: 'Saturday jollof is worth planning your whole afternoon around.', rating: 5 },
  { name: 'Ifeoma, Batch 23', quote: 'Ordered from my room and tracked it the whole way — no back and forth calls.', rating: 4 },
]

export function Reviews() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-10 flex items-end justify-between">
        <div><span className="eyebrow">Corp Members Say</span><h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Customer Reviews</h2></div>
        <Link to="/reviews" className="btn-ghost !px-4 !py-2 text-sm">Read all &amp; write one</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {REVIEWS.map((r) => (
          <div key={r.name} className="glass-card p-6">
            <div className="mb-3 flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < r.rating ? 'fill-gold-400 text-gold-400' : 'text-ink-600'} />)}</div>
            <p className="text-sm leading-relaxed text-bone-200/85">&ldquo;{r.quote}&rdquo;</p>
            <p className="mt-4 text-xs text-bone-400">— {r.name}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
