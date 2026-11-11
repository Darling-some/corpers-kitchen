import { useEffect, useState } from 'react'
import { subscribePaystackEnabled } from '../lib/settings'
export function usePaystackEnabled() {
  const [value, setValue] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => subscribePaystackEnabled((v) => { setValue(v); setLoading(false) }), [])
  return { value, loading }
}
