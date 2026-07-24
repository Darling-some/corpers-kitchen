import { useState } from 'react'
import { Copy, Check, Landmark } from 'lucide-react'
import { BANK_DETAILS } from '../data/bankDetails'

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access can fail in some contexts — the value is still visible to copy manually.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-ink-900 px-4 py-3">
      <div>
        <p className="text-xs text-bone-400">{label}</p>
        <p className="font-mono text-sm text-bone-50">{value}</p>
      </div>
      <button type="button" onClick={handleCopy} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-bone-300 hover:border-gold-400/50 hover:text-gold-300" aria-label={`Copy ${label}`}>
        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      </button>
    </div>
  )
}

export function BankTransferPanel({ orderNumber, total }: { orderNumber: string; total: number }) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium text-bone-100">
        <Landmark size={16} className="text-gold-400" /> Pay by bank transfer
      </p>
      <CopyField label="Account Name" value={BANK_DETAILS.accountName} />
      <CopyField label="Bank Name" value={BANK_DETAILS.bankName} />
      <CopyField label="Account Number" value={BANK_DETAILS.accountNumber} />
      <CopyField label="Amount" value={`₦${total.toLocaleString()}`} />
      <CopyField label="Transfer Narration / Reference" value={orderNumber} />
      <p className="text-xs text-bone-400">
        Important: include <span className="font-mono text-gold-300">{orderNumber}</span> in your transfer narration so we can match your payment.
      </p>
      <p className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-2.5 text-xs text-warn">
        After you tell us the sender name below, we'll match it against our bank alert and confirm your order — no receipt needed.
      </p>
    </div>
  )
}
