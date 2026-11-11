import { useEffect, useRef, useState } from 'react'
import { subscribeTodayOrders } from '../lib/orders'
import { playOrderChime } from '../lib/notify'
import type { Order } from '../types'
export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const known = useRef<Set<string> | null>(null)
  useEffect(() => subscribeTodayOrders((next) => {
    if (known.current && next.some((o) => !known.current!.has(o.id))) playOrderChime()
    known.current = new Set(next.map((o) => o.id))
    setOrders(next); setLoading(false)
  }), [])
  return { orders, loading }
}
