import { useEffect, useState } from 'react'
import { subscribeOrderingStatus } from '../lib/settings'

export function useOrderingStatus() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeOrderingStatus((open) => {
      setIsOpen(open)
      setLoading(false)
    })
    return unsub
  }, [])

  return { isOpen, loading }
}
