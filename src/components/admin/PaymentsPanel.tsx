import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, Phone, Clock } from 'lucide-react'
import { subscribeAllPaymentSubmissions, approvePaymentSubmission, rejectPaymentSubmission } from '../../lib/paymentSubmissions'
import { fetchOrderPhone } from '../../lib/orders'
import { formatClockTime } from '../../utils/orderNumber'
import type { PaymentSubmission } from '../../types'
type F = PaymentSubmission['status'] | 'all'
const FILTERS: { v: F; l: string }[] = [{ v: 'pending', l: 'Pending Review' }, { v: 'approved', l: 'Approved' }, { v: 'rejected', l: 'Rejected' }, { v: 'all', l: 'All' }]
export function PaymentsPanel() {
  const [subs, setSubs] = useState<PaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<F>('pending')
  const [busy, setBusy] = useState<string | null>(null)
  const [calling, setCalling] = useState<string | null>(null)
  useEffect(() => subscribeAllPaymentSubmissions((s) => { setSubs(s); setLoading(false) }), [])
  const list = filter === 'all' ? subs : subs.filter((s) => s.status === filter)
  async function act(s: PaymentSubmission, fn: (s: PaymentSubmission) => Promise<void>) { setBusy(s.id); try { await fn(s) } finally { setBusy(null) } }
  async function call(id: string) { setCalling(id); try { const p = await fetchOrderPhone(id); if (p) window.location.href = `tel:${p}` } finally { setCalling(null) } }
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">{FILTERS.map((f) => <button key={f.v} onClick={() => setFilter(f.v)} className={`rounded-full border px-4 py-1.5 text-xs ${filter === f.v ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-white/10 text-bone-400'}`}>{f.l}</button>)}</div>
      {loading && <div className="grid gap-3 sm:grid-cols-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>}
      {!loading && list.length === 0 && <div className="glass-card p-10 text-center text-bone-400">No {filter === 'all' ? '' : filter} payment submissions.</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((s) => (
          <div key={s.id} className="glass-card p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-gold-400">{s.orderNumber}</p><p className="font-display font-medium">{s.customerName}</p>
                <p className="flex items-center gap-1 text-xs text-bone-400"><Clock size={10} /> Submitted {formatClockTime(s.createdAt)}</p>
                <button onClick={() => call(s.orderId)} disabled={calling === s.orderId} className="mt-1 inline-flex items-center gap-1 text-xs text-bone-400 hover:text-gold-300">{calling === s.orderId ? <Loader2 className="animate-spin" size={11} /> : <Phone size={11} />} Call customer</button>
              </div>
              <p className="font-mono text-sm text-gold-300">₦{s.total.toLocaleString()}</p>
            </div>
            <div className="mb-3 space-y-1 text-xs text-bone-300"><p><span className="text-bone-400">Sender Name:</span> <span className="font-medium text-bone-100">{s.senderName}</span></p>{s.notes && <p><span className="text-bone-400">Notes:</span> {s.notes}</p>}<p className="text-bone-400">{s.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p></div>
            <p className="mb-3 rounded-xl border border-white/10 bg-ink-900 p-3 text-xs text-bone-400">Check your bank alerts for <span className="font-medium text-bone-100">{s.senderName}</span> sending <span className="font-mono text-gold-300">₦{s.total.toLocaleString()}</span>, then confirm below.</p>
            {s.status === 'pending' ? (
              <div className="flex gap-2">
                <button onClick={() => act(s, approvePaymentSubmission)} disabled={busy === s.id} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-success/15 px-4 py-2 text-sm font-medium text-success hover:bg-success/25">{busy === s.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Confirm Payment</button>
                <button onClick={() => { if (confirm(`Reject this payment from ${s.senderName}?`)) act(s, rejectPaymentSubmission) }} disabled={busy === s.id} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-danger/40 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"><XCircle size={14} /> Reject</button>
              </div>
            ) : <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${s.status === 'approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{s.status === 'approved' ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {s.status === 'approved' ? 'Approved' : 'Rejected'}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
