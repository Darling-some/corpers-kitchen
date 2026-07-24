import { useEffect, useRef, useState } from 'react'
import { subscribeTodayOrders } from '../lib/orders'
import { playOrderChime } from '../lib/notify'
import type { Order } from '../types'

export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const knownIds = useRef<Set<string> | null>(null)

  useEffect(() => {
    const unsub = subscribeTodayOrders((next) => {
      if (knownIds.current) {
        const newOnes = next.filter((o) => !knownIds.current!.has(o.id))
        if (newOnes.length > 0) playOrderChime()
      }
      knownIds.current = new Set(next.map((o) => o.id))
      setOrders(next)
      setLoading(false)
    })
    return unsub
  }, [])

  return { orders, loading }
}
