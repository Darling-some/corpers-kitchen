import { useState } from 'react'
import { CalendarSearch, Loader2, X } from 'lucide-react'
import { fetchOrdersInRange } from '../../lib/orders'
import { dayBoundsMillis } from '../../utils/orderNumber'
import type { Order } from '../../types'
export function OrderHistoryLookup({ onResults }: { onResults: (o: Order[] | null) => void }) {
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(false)
  async function search() { if (!date) return; setLoading(true); try { const [a, b] = dayBoundsMillis(date); onResults(await fetchOrdersInRange(a, b)); setActive(true) } finally { setLoading(false) } }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <CalendarSearch size={15} className="text-gold-400" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-gold-400/60" />
      <button onClick={search} disabled={!date || loading} className="btn-ghost !px-4 !py-2 text-xs">{loading && <Loader2 className="animate-spin" size={14} />} Look Up That Day</button>
      {active && <button onClick={() => { setDate(''); setActive(false); onResults(null) }} className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs text-bone-400 hover:text-gold-300"><X size={12} /> Back to Today (Live)</button>}
    </div>
  )
}
