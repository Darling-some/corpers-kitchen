import { useEffect, useState } from 'react'
import { subscribePaystackEnabled } from '../lib/settings'

export function usePaystackEnabled() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => { const unsub = subscribePaystackEnabled((next) => { setEnabled(next); setLoading(false) }); return unsub }, [])
  return { enabled, loading }
}
