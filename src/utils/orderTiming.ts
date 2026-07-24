import { PREP_MINUTES_PER_ORDER } from './orderNumber'
import type { MenuItem, Order } from '../types'

export function menuItemsById(items: MenuItem[]): Record<string, MenuItem> {
  return Object.fromEntries(items.map((item) => [item.id, item]))
}

/**
 * Models the kitchen as ONE continuous clock, not independent per-order math.
 *
 * Picture a single pot: order #1 arrives at 12:00, ready at 12:11. If order
 * #2 arrives at 12:05 — before the pot is free — it has to wait: it starts
 * at 12:11 (when the pot frees up) and is ready at 12:22. If order #2
 * instead arrives at 12:15 (after the pot was already free), it starts
 * right away and is ready at 12:26. This function walks every active order
 * in creation order and threads that single clock through all of them.
 *
 * 'fixed_time' items (a shared pot of rice/spaghetti with an admin-set
 * ready time) don't occupy this per-order clock at all — they're
 * overlaid afterward as the max of "sequential per-order time" and
 * "the batch's ready time", since an order can mix both kinds of item.
 */
export function computeSequentialReadyTimes(
  activeOrders: Order[],
  menuById: Record<string, MenuItem>
): Record<string, number> {
  const sorted = [...activeOrders].sort((a, b) => a.createdAt - b.createdAt)
  const result: Record<string, number> = {}
  let kitchenFreeAt = 0

  for (const order of sorted) {
    const menuItemsInOrder = order.items.map((line) => menuById[line.menuItemId]).filter((mi): mi is MenuItem => !!mi)
    const perOrderItems = menuItemsInOrder.filter((mi) => mi.timingMode !== 'fixed_time')
    const fixedItems = menuItemsInOrder.filter((mi) => mi.timingMode === 'fixed_time' && mi.fixedReadyAt)

    let sequentialReadyAt: number | null = null
    if (perOrderItems.length > 0) {
      const prepMinutes = Math.max(...perOrderItems.map((mi) => mi.prepMinutes ?? PREP_MINUTES_PER_ORDER))
      const start = Math.max(order.createdAt, kitchenFreeAt)
      sequentialReadyAt = start + prepMinutes * 60_000
      kitchenFreeAt = sequentialReadyAt
    }

    const fixedReadyAt = fixedItems.length > 0 ? Math.max(...fixedItems.map((mi) => mi.fixedReadyAt!)) : null

    const candidates = [sequentialReadyAt, fixedReadyAt].filter((v): v is number => v !== null)
    result[order.id] = candidates.length > 0 ? Math.max(...candidates) : order.createdAt
  }

  return result
}

export function hasFixedBatchItem(order: Order, menuById: Record<string, MenuItem>): boolean {
  return order.items.some((line) => menuById[line.menuItemId]?.timingMode === 'fixed_time')
}
