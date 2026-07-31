import { useEffect, useMemo, useState } from 'react'
import { subscribeDisabledBankAccounts } from '../lib/settings'
import { BANK_ACCOUNTS } from '../data/bankDetails'

export function useBankAccounts() {
  const [disabledLabels, setDisabledLabels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeDisabledBankAccounts((next) => { setDisabledLabels(next); setLoading(false) })
    return unsub
  }, [])

  // Safety net: if every account somehow ended up disabled, fall back to
  // showing all of them rather than leaving customers with no way to pay.
  const enabledAccounts = useMemo(() => {
    const filtered = BANK_ACCOUNTS.filter((acc) => !disabledLabels.includes(acc.label))
    return filtered.length > 0 ? filtered : BANK_ACCOUNTS
  }, [disabledLabels])

  return { enabledAccounts, disabledLabels, loading }
}
