import { useMemo, useState } from 'react'
import { Search, Phone, ChevronDown, CheckCircle2, ChefHat, Clock, FileCheck2, XCircle, Loader2 } from 'lucide-react'
import { updateOrderStatus, fetchOrderPhone } from '../../lib/orders'
import type { Order, OrderStatus, PaymentStatus } from '../../types'

const STATUS_OPTIONS: OrderStatus[] = ['awaiting_payment', 'waiting', 'preparing', 'ready', 'delivered', 'cancelled']

const STATUS_STYLE: Record<OrderStatus, string> = {
  awaiting_payment: 'text-warn bg-warn/10',
  waiting: 'text-bone-200 bg-ink-700',
  preparing: 'text-gold-300 bg-gold-400/10',
  ready: 'text-success bg-success/10',
  delivered: 'text-bone-400 bg-ink-700',
  cancelled: 'text-danger bg-danger/10',
}

const PAYMENT_STYLE: Record<PaymentStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', className: 'text-warn', icon: Clock },
  submitted: { label: 'Submitted', className: 'text-gold-300', icon: FileCheck2 },
  paid: { label: 'Paid', className: 'text-success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'text-danger', icon: XCircle },
}

/** Orders not yet marked as physically prepared — the one-tap button moves
 * them straight to "ready" so kitchen staff never lose track. */
const NOT_YET_PREPARED: OrderStatus[] = ['waiting', 'preparing']

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [justMarked, setJustMarked] = useState<Set<string>>(new Set())
  const [callingId, setCallingId] = useState<string | null>(null)

  async function handleCall(orderId: string) {
    setCallingId(orderId)
    try {
      const phone = await fetchOrderPhone(orderId)
      if (phone) window.location.href = `tel:${phone}`
    } finally {
      setCallingId(null)
    }
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesFilter = filter === 'all' || o.status === filter
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [orders, search, filter])

  async function markAsPrepared(orderId: string) {
    setJustMarked((prev) => new Set(prev).add(orderId))
    try {
      await updateOrderStatus(orderId, 'ready')
    } catch {
      setJustMarked((prev) => { const next = new Set(prev); next.delete(orderId); return next })
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order # or name…" className="w-full rounded-xl border border-white/10 bg-ink-900 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gold-400/60" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', ...STATUS_OPTIONS] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${filter === s ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-white/10 text-bone-400'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-bone-400">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Prepared?</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Contact</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const needsPrep = NOT_YET_PREPARED.includes(o.status)
              const showAsMarked = justMarked.has(o.id) || !needsPrep
              const payMeta = PAYMENT_STYLE[o.paymentStatus]
              const PayIcon = payMeta.icon
              return (
                <tr key={o.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-gold-400">{o.orderNumber}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3 text-bone-300">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</td>
                  <td className="px-4 py-3 font-mono">₦{o.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs ${payMeta.className}`}>
                      <PayIcon size={12} /> {payMeta.label} <span className="text-bone-400">· {o.paymentMethod === 'paystack' ? 'Paystack' : 'Transfer'}</span>
                    </span>
                    {o.paymentReference && <span className="font-mono text-[10px] text-bone-400">{o.paymentReference}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {o.status === 'awaiting_payment' ? (
                      <span className="text-xs text-bone-400">—</span>
                    ) : showAsMarked ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                        <CheckCircle2 size={13} /> Prepared
                      </span>
                    ) : (
                      <button onClick={() => markAsPrepared(o.id)} className="flex items-center gap-1.5 rounded-full border border-gold-400/50 bg-gold-400/10 px-3 py-1.5 text-xs font-medium text-gold-300 hover:bg-gold-400/20">
                        <ChefHat size={13} /> Mark as Prepared
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)} className={`appearance-none rounded-full py-1.5 pl-3 pr-7 text-xs capitalize outline-none ${STATUS_STYLE[o.status]}`}>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-ink-900 text-bone-50">{s.replace('_', ' ')}</option>)}
                      </select>
                      <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleCall(o.id)} disabled={callingId === o.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-bone-300 hover:border-gold-400/50 hover:text-gold-300">
                      {callingId === o.id ? <Loader2 className="animate-spin" size={12} /> : <Phone size={12} />} Call
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-bone-400">No orders match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
