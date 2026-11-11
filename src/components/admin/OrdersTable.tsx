import { useMemo, useState } from 'react'
import { Search, Phone, ChevronDown, CheckCircle2, ChefHat, Clock, FileCheck2, XCircle, Loader2, MessageSquare } from 'lucide-react'
import { updateOrderStatus, fetchOrderPhone } from '../../lib/orders'
import { formatClockTime } from '../../utils/orderNumber'
import type { Order, OrderStatus, PaymentStatus } from '../../types'

const STATUSES: OrderStatus[] = ['awaiting_payment', 'waiting', 'preparing', 'ready', 'delivered', 'cancelled']
const STATUS_CLS: Record<OrderStatus, string> = { awaiting_payment: 'text-warn bg-warn/10', waiting: 'text-bone-200 bg-ink-700', preparing: 'text-gold-300 bg-gold-400/10', ready: 'text-success bg-success/10', delivered: 'text-bone-400 bg-ink-700', cancelled: 'text-danger bg-danger/10' }
const PAY: Record<PaymentStatus, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', cls: 'text-warn', icon: Clock }, submitted: { label: 'Submitted', cls: 'text-gold-300', icon: FileCheck2 },
  paid: { label: 'Paid', cls: 'text-success', icon: CheckCircle2 }, rejected: { label: 'Rejected', cls: 'text-danger', icon: XCircle },
}
export function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [marked, setMarked] = useState<Set<string>>(new Set())
  const [calling, setCalling] = useState<string | null>(null)
  const rows = useMemo(() => orders.filter((o) => {
    const q = search.trim().toLowerCase()
    return (filter === 'all' || o.status === filter) && (!q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q))
  }), [orders, search, filter])
  async function prepared(id: string) {
    setMarked((p) => new Set(p).add(id))
    try { await updateOrderStatus(id, 'ready') } catch { setMarked((p) => { const n = new Set(p); n.delete(id); return n }) }
  }
  async function call(id: string) {
    setCalling(id)
    try { const p = await fetchOrderPhone(id); if (p) window.location.href = `tel:${p}` } finally { setCalling(null) }
  }
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order # or name…" className="w-full rounded-xl border border-white/10 bg-ink-900 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gold-400/60" /></div>
        <div className="flex flex-wrap gap-2">{(['all', ...STATUSES] as const).map((s) => <button key={s} onClick={() => setFilter(s)} className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${filter === s ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-white/10 text-bone-400'}`}>{s.replace('_', ' ')}</button>)}</div>
      </div>
      <div className="glass-card overflow-x-auto">
        <table className="w-full min-w-[1020px] text-left text-sm">
          <thead><tr className="border-b border-white/10 text-xs uppercase tracking-wide text-bone-400">{['Order', 'Time', 'Customer', 'Items', 'Total', 'Payment', 'Prepared?', 'Status', 'Contact'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((o) => {
              const done = marked.has(o.id) || !(o.status === 'waiting' || o.status === 'preparing')
              const pm = PAY[o.paymentStatus]; const PI = pm.icon
              return (
                <tr key={o.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-gold-400">{o.orderNumber}</td>
                  <td className="px-4 py-3 font-mono text-xs text-bone-300">{formatClockTime(o.createdAt)}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3 text-bone-300">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}{o.specialInstructions && <p className="mt-1 flex items-start gap-1 rounded-lg bg-gold-400/10 px-2 py-1 text-xs text-gold-300"><MessageSquare size={11} className="mt-0.5 shrink-0" /> {o.specialInstructions}</p>}</td>
                  <td className="px-4 py-3 font-mono">₦{o.total.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`flex items-center gap-1 text-xs ${pm.cls}`}><PI size={12} /> {pm.label} <span className="text-bone-400">· {o.paymentMethod === 'paystack' ? 'Paystack' : 'Transfer'}</span></span>{o.paymentReference && <span className="font-mono text-[10px] text-bone-400">{o.paymentReference}</span>}</td>
                  <td className="px-4 py-3">{o.status === 'awaiting_payment' ? <span className="text-xs text-bone-400">—</span> : done ? <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success"><CheckCircle2 size={13} /> Prepared</span> : <button onClick={() => prepared(o.id)} className="flex items-center gap-1.5 rounded-full border border-gold-400/50 bg-gold-400/10 px-3 py-1.5 text-xs font-medium text-gold-300 hover:bg-gold-400/20"><ChefHat size={13} /> Mark as Prepared</button>}</td>
                  <td className="px-4 py-3"><div className="relative inline-block"><select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)} className={`appearance-none rounded-full py-1.5 pl-3 pr-7 text-xs capitalize outline-none ${STATUS_CLS[o.status]}`}>{STATUSES.map((s) => <option key={s} value={s} className="bg-ink-900 text-bone-50">{s.replace('_', ' ')}</option>)}</select><ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" /></div></td>
                  <td className="px-4 py-3"><button onClick={() => call(o.id)} disabled={calling === o.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-bone-300 hover:border-gold-400/50 hover:text-gold-300">{calling === o.id ? <Loader2 className="animate-spin" size={12} /> : <Phone size={12} />} Call</button></td>
                </tr>
              )
            })}
            {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-bone-400">No orders match your search.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
