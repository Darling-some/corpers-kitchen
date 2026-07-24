import { useState } from 'react'
import { CalendarSearch, Loader2, X } from 'lucide-react'
import { fetchOrdersInRange } from '../../lib/orders'
import { dayBoundsMillis } from '../../utils/orderNumber'
import type { Order } from '../../types'

interface OrderHistoryLookupProps {
  onResults: (orders: Order[] | null) => void
}

/** A small date-picker so admin can pull up any past day's orders — the
 * live queue only shows today's, but nothing is ever deleted from
 * Firestore, so any previous day is always one lookup away. Useful for
 * settling a dispute about "my order from yesterday", checking an order
 * number, or reviewing a specific day's sales. */
export function OrderHistoryLookup({ onResults }: OrderHistoryLookupProps) {
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(false)

  async function handleSearch() {
    if (!date) return
    setLoading(true)
    try {
      const [start, end] = dayBoundsMillis(date)
      const orders = await fetchOrdersInRange(start, end)
      onResults(orders)
      setActive(true)
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setDate('')
    setActive(false)
    onResults(null)
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <CalendarSearch size={15} className="text-gold-400" />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-gold-400/60"
      />
      <button onClick={handleSearch} disabled={!date || loading} className="btn-ghost !px-4 !py-2 text-xs">
        {loading ? <Loader2 className="animate-spin" size={14} /> : null} Look Up That Day
      </button>
      {active && (
        <button onClick={handleClear} className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs text-bone-400 hover:text-gold-300">
          <X size={12} /> Back to Today (Live)
        </button>
      )}
    </div>
  )
}
