import { useEffect, useMemo, useState } from 'react'
import { subscribeActiveQueue, toPublicQueue } from '../lib/orders'
import { useMenu } from './useMenu'
import { computeSequentialReadyTimes, menuItemsById } from '../utils/orderTiming'
import type { Order } from '../types'
export function useQueue() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { allItems } = useMenu()
  useEffect(() => subscribeActiveQueue((o) => { setOrders(o); setLoading(false) }), [])
  const menuById = useMemo(() => menuItemsById(allItems), [allItems])
  const sorted = useMemo(() => [...orders].sort((a, b) => (a.confirmedAt ?? a.createdAt) - (b.confirmedAt ?? b.createdAt)), [orders])
  const ready = useMemo(() => computeSequentialReadyTimes(sorted, menuById), [sorted, menuById])
  const queue = useMemo(() => toPublicQueue(sorted, ready), [sorted, ready])
  return { queue, loading, totalAhead: queue.length }
}
