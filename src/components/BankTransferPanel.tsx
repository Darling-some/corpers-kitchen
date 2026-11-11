import { useEffect, useState } from 'react'
import { Copy, Check, Landmark, Phone } from 'lucide-react'
import { USSD_BANKS } from '../data/ussdCodes'
import { useBankAccounts } from '../hooks/useBankAccounts'
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* value is still visible */ } }
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-ink-900 px-4 py-3">
      <div><p className="text-xs text-bone-400">{label}</p><p className="font-mono text-sm text-bone-50">{value}</p></div>
      <button type="button" onClick={copy} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-bone-300 hover:border-gold-400/50 hover:text-gold-300" aria-label={`Copy ${label}`}>{copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}</button>
    </div>
  )
}
export function BankTransferPanel({ orderNumber, total }: { orderNumber: string; total: number }) {
  const { enabledAccounts } = useBankAccounts()
  const [idx, setIdx] = useState(0)
  useEffect(() => { if (idx >= enabledAccounts.length) setIdx(0) }, [enabledAccounts, idx])
  const acc = enabledAccounts[idx] ?? enabledAccounts[0]
  if (!acc) return null
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium text-bone-100"><Landmark size={16} className="text-gold-400" /> Pay by bank transfer</p>
      {enabledAccounts.length > 1 && (
        <div>
          <p className="mb-1.5 text-xs text-bone-400">Choose whichever bank is working best for you right now:</p>
          <div className="flex flex-wrap gap-2">{enabledAccounts.map((a, i) => <button key={a.label} type="button" onClick={() => setIdx(i)} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${i === idx ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-white/10 text-bone-300'}`}>{a.label}</button>)}</div>
        </div>
      )}
      <CopyField label="Account Name" value={acc.accountName} />
      <CopyField label="Bank Name" value={acc.bankName} />
      <CopyField label="Account Number" value={acc.accountNumber} />
      <CopyField label="Amount" value={`₦${total.toLocaleString()}`} />
      <CopyField label="Transfer Narration / Reference" value={orderNumber} />
      <p className="text-xs text-bone-400">Important: include <span className="font-mono text-gold-300">{orderNumber}</span> in your transfer narration so we can match your payment.</p>
      <p className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-2.5 text-xs text-warn">After you tell us the sender name below, we'll match it against our bank alert and confirm your order — no receipt needed. Your order only joins the kitchen queue once we confirm it.</p>
      <p className="rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-2.5 text-xs text-gold-300">Tip: copy your details first, then open your banking app — your order stays saved here even if you switch apps.</p>
      <div className="pt-2">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs text-bone-400"><Phone size={12} /> Prefer USSD? Quick-dial your bank's code (you still navigate the menu yourself):</p>
        <div className="flex flex-wrap gap-2">{USSD_BANKS.map((b) => <a key={b.bankName} href={`tel:${encodeURIComponent(b.code)}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-bone-300 hover:border-gold-400/50 hover:text-gold-300">{b.bankName} {b.code}</a>)}</div>
      </div>
    </div>
  )
}
