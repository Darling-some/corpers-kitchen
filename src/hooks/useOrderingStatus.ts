import { useEffect, useState } from 'react'
import { subscribeOrderingStatus } from '../lib/settings'
export function useOrderingStatus() {
  const [value, setValue] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => subscribeOrderingStatus((v) => { setValue(v); setLoading(false) }), [])
  return { value, loading }
}
