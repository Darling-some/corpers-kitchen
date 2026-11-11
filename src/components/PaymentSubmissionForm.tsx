import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { submitPaymentProof } from '../lib/paymentSubmissions'
import type { Order } from '../types'
export function PaymentSubmissionForm({ order, onSubmitted }: { order: Order; onSubmitted: () => void }) {
  const [senderName, setSenderName] = useState(order.customerName)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!senderName.trim()) { setError('Please enter the name you sent the transfer from.'); return }
    setError(''); setBusy(true)
    try { await submitPaymentProof({ order, senderName, notes }); onSubmitted() } catch { setError('Something went wrong submitting your payment. Please try again.') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-white/10 pt-4">
      <div>
        <label className="mb-1 block text-sm text-bone-400">Sender Name</label>
        <input value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="Name on the account you paid from" />
        <p className="mt-1 text-xs text-bone-400">We'll match this against the bank alert we receive to confirm your payment.</p>
      </div>
      <div><label className="mb-1 block text-sm text-bone-400">Notes (optional)</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="Anything else we should know" /></div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}{busy ? 'Submitting…' : 'I Have Made Payment'}</button>
    </form>
  )
}
