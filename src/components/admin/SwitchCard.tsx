import { useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
/** Reusable on/off card used for the Ordering, Paystack and Chat switches. */
export function SwitchCard({ icon, on, loading, titleOn, titleOff, descOn, descOff, labelOn, labelOff, onToggle, danger }: {
  icon: ReactNode; on: boolean; loading: boolean; titleOn: string; titleOff: string; descOn: string; descOff: string; labelOn: string; labelOff: string; onToggle: () => Promise<void>; danger?: boolean
}) {
  const [busy, setBusy] = useState(false)
  async function click() { setBusy(true); try { await onToggle() } finally { setBusy(false) } }
  return (
    <div className={`glass-card flex items-center justify-between gap-4 p-5 ${on ? 'border-success/40' : danger ? 'border-danger/40' : 'border-white/10'}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-full ${on ? 'bg-success/15 text-success' : danger ? 'bg-danger/15 text-danger' : 'bg-ink-700 text-bone-400'}`}>{icon}</span>
        <div><p className="font-display font-medium">{loading ? 'Checking…' : on ? titleOn : titleOff}</p><p className="text-xs text-bone-400">{on ? descOn : descOff}</p></div>
      </div>
      <button onClick={click} disabled={loading || busy} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${on ? 'border border-danger/40 text-danger hover:bg-danger/10' : 'bg-success text-ink-950 hover:opacity-90'}`}>{busy ? <Loader2 className="inline animate-spin" size={16} /> : on ? labelOff : labelOn}</button>
    </div>
  )
}
