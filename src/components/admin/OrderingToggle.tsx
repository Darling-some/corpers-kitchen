import { useState } from 'react'
import { Power, Loader2 } from 'lucide-react'
import { useOrderingStatus } from '../../hooks/useOrderingStatus'
import { setOrderingOpen } from '../../lib/settings'

export function OrderingToggle() {
  const { isOpen, loading } = useOrderingStatus()
  const [busy, setBusy] = useState(false)
  async function handleToggle() { setBusy(true); try { await setOrderingOpen(!isOpen) } finally { setBusy(false) } }
  return (
    <div className={`glass-card flex items-center justify-between gap-4 p-5 ${isOpen ? 'border-success/40' : 'border-danger/40'}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-full ${isOpen ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}><Power size={18} /></span>
        <div>
          <p className="font-display font-medium">{loading ? 'Checking…' : isOpen ? 'Ordering is OPEN' : 'Ordering is CLOSED'}</p>
          <p className="text-xs text-bone-400">{isOpen ? 'Customers can place orders right now.' : "Customers see a closed message — flip this when you're ready."}</p>
        </div>
      </div>
      <button onClick={handleToggle} disabled={loading || busy} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${isOpen ? 'border border-danger/40 text-danger hover:bg-danger/10' : 'bg-success text-ink-950 hover:opacity-90'}`}>
        {busy ? <Loader2 className="inline animate-spin" size={16} /> : isOpen ? 'Close Ordering' : 'Open Ordering'}
      </button>
    </div>
  )
}
