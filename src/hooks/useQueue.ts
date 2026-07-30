import { useEffect, useMemo, useState } from 'react'
import { subscribeActiveQueue, toPublicQueue } from '../lib/orders'
import { useMenu } from './useMenu'
import { computeSequentialReadyTimes, menuItemsById } from '../utils/orderTiming'
import type { Order, PublicQueueEntry } from '../types'

export function useQueue() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { allItems: menuItems } = useMenu()

  useEffect(() => { const unsub = subscribeActiveQueue((next) => { setOrders(next); setLoading(false) }); return unsub }, [])

  const menuById = useMemo(() => menuItemsById(menuItems), [menuItems])
  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => (a.confirmedAt ?? a.createdAt) - (b.confirmedAt ?? b.createdAt)),
    [orders]
  )
  const readyTimes = useMemo(() => computeSequentialReadyTimes(sortedOrders, menuById), [sortedOrders, menuById])
  const queue: PublicQueueEntry[] = useMemo(() => toPublicQueue(sortedOrders, readyTimes), [sortedOrders, readyTimes])

  return { queue, loading, totalAhead: queue.length }
}
