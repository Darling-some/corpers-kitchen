import { useEffect, useMemo, useState } from 'react'
import { subscribeDisabledBankAccounts } from '../lib/settings'
import { BANK_ACCOUNTS } from '../data/bankDetails'
export function useBankAccounts() {
  const [disabledLabels, setDisabled] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => subscribeDisabledBankAccounts((d) => { setDisabled(d); setLoading(false) }), [])
  // Safety net: if every account got switched off, show them all rather than leave customers unable to pay.
  const enabledAccounts = useMemo(() => { const f = BANK_ACCOUNTS.filter((a) => !disabledLabels.includes(a.label)); return f.length > 0 ? f : BANK_ACCOUNTS }, [disabledLabels])
  return { enabledAccounts, disabledLabels, loading }
}
