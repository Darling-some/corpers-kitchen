import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { usePaystackEnabled } from '../../hooks/usePaystackEnabled'
import { setPaystackEnabled } from '../../lib/settings'

/** Lets the admin turn Paystack (online payment) on once their account is
 * fully verified — starts disabled so the site can launch safely with
 * Bank Transfer only, no code changes needed to flip it on later. */
export function PaystackToggle() {
  const { enabled, loading } = usePaystackEnabled()
  const [busy, setBusy] = useState(false)

  async function handleToggle() {
    setBusy(true)
    try {
      await setPaystackEnabled(!enabled)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`glass-card flex items-center justify-between gap-4 p-5 ${enabled ? 'border-success/40' : 'border-white/10'}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-full ${enabled ? 'bg-success/15 text-success' : 'bg-ink-700 text-bone-400'}`}>
          <CreditCard size={18} />
        </span>
        <div>
          <p className="font-display font-medium">{loading ? 'Checking…' : enabled ? 'Online Payment (Paystack) is ON' : 'Online Payment (Paystack) is OFF'}</p>
          <p className="text-xs text-bone-400">{enabled ? 'Customers can pay by card, bank, or USSD via Paystack.' : 'Customers only see Bank Transfer — turn this on once your Paystack account is verified.'}</p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading || busy}
        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${enabled ? 'border border-danger/40 text-danger hover:bg-danger/10' : 'bg-success text-ink-950 hover:opacity-90'}`}
      >
        {busy ? <Loader2 className="inline animate-spin" size={16} /> : enabled ? 'Turn Off' : 'Turn On'}
      </button>
    </div>
  )
}
