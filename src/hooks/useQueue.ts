import { useEffect, useMemo, useState } from 'react'
import { subscribeActiveQueue, toPublicQueue } from '../lib/orders'
import { useMenu } from './useMenu'
import { computeSequentialReadyTimes, menuItemsById } from '../utils/orderTiming'
import type { Order, PublicQueueEntry } from '../types'

/**
 * The single source of truth for "who's next and when will it be ready".
 * Computes one continuous kitchen-clock timeline across every active order
 * (see computeSequentialReadyTimes), so the homepage live queue and the
 * order tracking page always agree on timing — neither computes it alone.
 */
export function useQueue() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { allItems: menuItems } = useMenu()

  useEffect(() => {
    const unsub = subscribeActiveQueue((next) => { setOrders(next); setLoading(false) })
    return unsub
  }, [])

  const menuById = useMemo(() => menuItemsById(menuItems), [menuItems])
  const readyTimes = useMemo(() => computeSequentialReadyTimes(orders, menuById), [orders, menuById])
  const queue: PublicQueueEntry[] = useMemo(() => toPublicQueue(orders, readyTimes), [orders, readyTimes])

  return { queue, loading, totalAhead: queue.length }
}
