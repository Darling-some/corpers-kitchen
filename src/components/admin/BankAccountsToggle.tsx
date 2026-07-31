import { useState } from 'react'
import { Landmark, Loader2 } from 'lucide-react'
import { BANK_ACCOUNTS } from '../../data/bankDetails'
import { useBankAccounts } from '../../hooks/useBankAccounts'
import { setBankAccountEnabled } from '../../lib/settings'

/** Lets the admin turn individual bank accounts on/off — e.g. switch off
 * Zenith for the day if it's having network issues, so customers only see
 * Opay until it's switched back on. At least one account always shows to
 * customers even if this gets mis-configured (see useBankAccounts). */
export function BankAccountsToggle() {
  const { disabledLabels, loading } = useBankAccounts()
  const [busyLabel, setBusyLabel] = useState<string | null>(null)

  async function handleToggle(label: string, currentlyEnabled: boolean) {
    setBusyLabel(label)
    try {
      await setBankAccountEnabled(label, !currentlyEnabled, disabledLabels)
    } finally {
      setBusyLabel(null)
    }
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-700 text-bone-400"><Landmark size={18} /></span>
        <div>
          <p className="font-display font-medium">Bank Transfer Accounts</p>
          <p className="text-xs text-bone-400">Turn an account off if it's having network issues — customers only see the ones that are on.</p>
        </div>
      </div>
      <div className="space-y-2">
        {BANK_ACCOUNTS.map((account) => {
          const enabled = loading ? true : !disabledLabels.includes(account.label)
          const busy = busyLabel === account.label
          return (
            <div key={account.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-900 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{account.label}</p>
                <p className="font-mono text-xs text-bone-400">{account.accountNumber}</p>
              </div>
              <button
                onClick={() => handleToggle(account.label, enabled)}
                disabled={loading || busy}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${enabled ? 'bg-success/15 text-success hover:bg-success/25' : 'border border-danger/40 text-danger hover:bg-danger/10'}`}
              >
                {busy ? <Loader2 className="inline animate-spin" size={13} /> : enabled ? 'On' : 'Off'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
