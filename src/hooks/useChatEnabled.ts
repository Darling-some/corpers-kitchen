import { useEffect, useState } from 'react'
import { subscribeChatEnabled } from '../lib/settings'
export function useChatEnabled() {
  const [value, setValue] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => subscribeChatEnabled((v) => { setValue(v); setLoading(false) }), [])
  return { value, loading }
}
