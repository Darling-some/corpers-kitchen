import { Power, CreditCard, MessagesSquare, Landmark, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { SwitchCard } from './SwitchCard'
import { useOrderingStatus } from '../../hooks/useOrderingStatus'
import { usePaystackEnabled } from '../../hooks/usePaystackEnabled'
import { useChatEnabled } from '../../hooks/useChatEnabled'
import { useBankAccounts } from '../../hooks/useBankAccounts'
import { BANK_ACCOUNTS } from '../../data/bankDetails'
import { setOrderingOpen, setPaystackEnabled, setChatEnabled, setBankAccountEnabled } from '../../lib/settings'

export function OrderingToggle() {
  const { value, loading } = useOrderingStatus()
  return <SwitchCard danger icon={<Power size={18} />} on={value} loading={loading} titleOn="Ordering is OPEN" titleOff="Ordering is CLOSED" descOn="Customers can place orders right now." descOff="Customers see a closed message — flip this when you're ready." labelOn="Open Ordering" labelOff="Close Ordering" onToggle={() => setOrderingOpen(!value)} />
}
export function PaystackToggle() {
  const { value, loading } = usePaystackEnabled()
  return <SwitchCard icon={<CreditCard size={18} />} on={value} loading={loading} titleOn="Online Payment (Paystack) is ON" titleOff="Online Payment (Paystack) is OFF" descOn="Customers can pay by card, bank, or USSD via Paystack." descOff="Customers only see Bank Transfer — turn on once your Paystack account is verified." labelOn="Turn On" labelOff="Turn Off" onToggle={() => setPaystackEnabled(!value)} />
}
export function ChatToggle() {
  const { value, loading } = useChatEnabled()
  return <SwitchCard icon={<MessagesSquare size={18} />} on={value} loading={loading} titleOn="Waiting Room chat is ON" titleOff="Waiting Room chat is OFF" descOn="Customers with an order today can chat. Moderate it in the Chat tab." descOff="Chat is hidden and nobody can post. Turn on when you can watch it." labelOn="Turn On" labelOff="Turn Off" onToggle={() => setChatEnabled(!value)} />
}
export function BankAccountsToggle() {
  const { disabledLabels, loading } = useBankAccounts()
  const [busy, setBusy] = useState<string | null>(null)
  async function toggle(label: string, enabled: boolean) { setBusy(label); try { await setBankAccountEnabled(label, !enabled, disabledLabels) } finally { setBusy(null) } }
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-ink-700 text-bone-400"><Landmark size={18} /></span><div><p className="font-display font-medium">Bank Transfer Accounts</p><p className="text-xs text-bone-400">Turn an account off if it's having network issues — customers only see the ones that are on.</p></div></div>
      <div className="space-y-2">
        {BANK_ACCOUNTS.map((a) => {
          const on = loading ? true : !disabledLabels.includes(a.label)
          return (
            <div key={a.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-900 px-4 py-3">
              <div><p className="text-sm font-medium">{a.label}</p><p className="font-mono text-xs text-bone-400">{a.accountNumber}</p></div>
              <button onClick={() => toggle(a.label, on)} disabled={loading || busy === a.label} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${on ? 'bg-success/15 text-success hover:bg-success/25' : 'border border-danger/40 text-danger hover:bg-danger/10'}`}>{busy === a.label ? <Loader2 className="inline animate-spin" size={13} /> : on ? 'On' : 'Off'}</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
