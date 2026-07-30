import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, Phone } from 'lucide-react'
import { subscribeAllPaymentSubmissions, approvePaymentSubmission, rejectPaymentSubmission } from '../../lib/paymentSubmissions'
import { fetchOrderPhone } from '../../lib/orders'
import type { PaymentSubmission } from '../../types'

const FILTERS: { value: PaymentSubmission['status'] | 'all'; label: string }[] = [
  { value: 'pending', label: 'Pending Review' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'all', label: 'All' },
]

export function PaymentsPanel() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PaymentSubmission['status'] | 'all'>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [callingId, setCallingId] = useState<string | null>(null)

  useEffect(() => { const unsub = subscribeAllPaymentSubmissions((next) => { setSubmissions(next); setLoading(false) }); return unsub }, [])

  const filtered = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter)

  async function handleApprove(submission: PaymentSubmission) { setBusyId(submission.id); try { await approvePaymentSubmission(submission) } finally { setBusyId(null) } }
  async function handleReject(submission: PaymentSubmission) {
    if (!confirm(`Reject this payment from ${submission.senderName}? The customer will be asked to submit again.`)) return
    setBusyId(submission.id); try { await rejectPaymentSubmission(submission) } finally { setBusyId(null) }
  }
  async function handleCall(orderId: string) {
    setCallingId(orderId)
    try { const phone = await fetchOrderPhone(orderId); if (phone) window.location.href = `tel:${phone}` } finally { setCallingId(null) }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => <button key={f.value} onClick={() => setFilter(f.value)} className={`rounded-full border px-4 py-1.5 text-xs ${filter === f.value ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-white/10 text-bone-400'}`}>{f.label}</button>)}
      </div>
      {loading && <div className="grid gap-3 sm:grid-cols-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>}
      {!loading && filtered.length === 0 && <div className="glass-card p-10 text-center text-bone-400">No {filter === 'all' ? '' : filter} payment submissions.</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((s) => (
          <div key={s.id} className="glass-card p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-gold-400">{s.orderNumber}</p>
                <p className="font-display font-medium">{s.customerName}</p>
                <button onClick={() => handleCall(s.orderId)} disabled={callingId === s.orderId} className="mt-1 inline-flex items-center gap-1 text-xs text-bone-400 hover:text-gold-300">
                  {callingId === s.orderId ? <Loader2 className="animate-spin" size={11} /> : <Phone size={11} />} Call customer
                </button>
              </div>
              <p className="font-mono text-sm text-gold-300">₦{s.total.toLocaleString()}</p>
            </div>
            <div className="mb-3 space-y-1 text-xs text-bone-300">
              <p><span className="text-bone-400">Sender Name:</span> <span className="font-medium text-bone-100">{s.senderName}</span></p>
              {s.notes && <p><span className="text-bone-400">Notes:</span> {s.notes}</p>}
              <p className="text-bone-400">{s.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
            </div>
            <p className="mb-3 rounded-xl border border-white/10 bg-ink-900 p-3 text-xs text-bone-400">
              Check your bank alerts for <span className="font-medium text-bone-100">{s.senderName}</span> sending <span className="font-mono text-gold-300">₦{s.total.toLocaleString()}</span>, then confirm below.
            </p>
            {s.status === 'pending' ? (
              <div className="flex gap-2">
                <button onClick={() => handleApprove(s)} disabled={busyId === s.id} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-success/15 px-4 py-2 text-sm font-medium text-success hover:bg-success/25">{busyId === s.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Confirm Payment</button>
                <button onClick={() => handleReject(s)} disabled={busyId === s.id} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-danger/40 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"><XCircle size={14} /> Reject</button>
              </div>
            ) : (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${s.status === 'approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{s.status === 'approved' ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {s.status === 'approved' ? 'Approved' : 'Rejected'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
