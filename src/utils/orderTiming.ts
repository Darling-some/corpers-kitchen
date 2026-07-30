import { PREP_MINUTES_PER_ORDER } from './orderNumber'
import type { MenuItem, Order } from '../types'

export function menuItemsById(items: MenuItem[]): Record<string, MenuItem> {
  return Object.fromEntries(items.map((item) => [item.id, item]))
}

/** The moment the kitchen clock should start counting for this order —
 * NOT when it was originally placed, but when payment was actually
 * confirmed (instant for Paystack, whenever the admin clicks Confirm for
 * a manual transfer). Falls back to createdAt only for old orders from
 * before this field existed. */
function clockStartFor(order: Order): number {
  return order.confirmedAt ?? order.createdAt
}

/**
 * Models the kitchen as ONE continuous clock, not independent per-order math.
 *
 * Picture a single pot: order #1 is confirmed at 12:00, ready at 12:11. If
 * order #2 is confirmed at 12:05 — before the pot is free — it has to
 * wait: it starts at 12:11 (when the pot frees up) and is ready at 12:22.
 * If order #2 instead is confirmed at 12:15 (after the pot was already
 * free), it starts right away and is ready at 12:26. This function walks
 * every active order in CONFIRMATION order (not order-placed order) and
 * threads that single clock through all of them.
 *
 * Anchoring on confirmation time (not creation time) matters a lot for
 * manual bank transfers: a customer might place an order at 12:00 but the
 * admin doesn't get to confirm it until 12:20 after checking their bank
 * alert. The countdown must start from 12:20, not 12:00.
 *
 * IMPORTANT — this also stays honest against reality: once an order is
 * actually marked 'ready' (or 'delivered'), its REAL completion time
 * (`actualReadyAt`) becomes the anchor for everyone still behind it in
 * line, replacing whatever the 11-minute prediction said. So if the
 * kitchen finishes two orders together in 6 minutes instead of the
 * predicted 11, everyone else's estimate shrinks to match the moment
 * "ready" is clicked.
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
  const sorted = [...activeOrders].sort((a, b) => clockStartFor(a) - clockStartFor(b))
  const result: Record<string, number> = {}
  let kitchenFreeAt = 0

  for (const order of sorted) {
    const menuItemsInOrder = order.items.map((line) => menuById[line.menuItemId]).filter((mi): mi is MenuItem => !!mi)
    const perOrderItems = menuItemsInOrder.filter((mi) => mi.timingMode !== 'fixed_time')
    const fixedItems = menuItemsInOrder.filter((mi) => mi.timingMode === 'fixed_time' && mi.fixedReadyAt)

    let sequentialReadyAt: number | null = null
    if (perOrderItems.length > 0) {
      if (order.status === 'ready' || order.status === 'delivered') {
        const actual = order.actualReadyAt ?? order.updatedAt
        sequentialReadyAt = actual
        kitchenFreeAt = Math.max(kitchenFreeAt, actual)
      } else {
        const prepMinutes = Math.max(...perOrderItems.map((mi) => mi.prepMinutes ?? PREP_MINUTES_PER_ORDER))
        const start = Math.max(clockStartFor(order), kitchenFreeAt)
        sequentialReadyAt = start + prepMinutes * 60_000
        kitchenFreeAt = sequentialReadyAt
      }
    }

    const fixedReadyAt = fixedItems.length > 0 ? Math.max(...fixedItems.map((mi) => mi.fixedReadyAt!)) : null

    const candidates = [sequentialReadyAt, fixedReadyAt].filter((v): v is number => v !== null)
    result[order.id] = candidates.length > 0 ? Math.max(...candidates) : clockStartFor(order)
  }

  return result
}

export function hasFixedBatchItem(order: Order, menuById: Record<string, MenuItem>): boolean {
  return order.items.some((line) => menuById[line.menuItemId]?.timingMode === 'fixed_time')
}

export interface KitchenBoardEntry {
  order: Order
  quantity: number
}

export interface KitchenBoardGroup {
  itemName: string
  timingMode: 'per_order' | 'fixed_time'
  fixedReadyAt?: number
  totalQuantity: number
  entries: KitchenBoardEntry[]
}

/** Groups every order still waiting to be cooked by which menu item it
 * contains, so if five people all ordered Noodles right now, they show up
 * together instead of scattered across a flat list. Groups sorted by
 * whichever item has the longest-waiting customer. */
export function groupOrdersByItem(orders: Order[], menuById: Record<string, MenuItem>): KitchenBoardGroup[] {
  const pending = orders.filter((o) => o.status === 'waiting' || o.status === 'preparing')
  const groups = new Map<string, KitchenBoardGroup>()

  for (const order of pending) {
    for (const line of order.items) {
      const menuItem = menuById[line.menuItemId]
      const itemName = menuItem?.name ?? line.name
      const timingMode = menuItem?.timingMode ?? 'per_order'

      if (!groups.has(itemName)) {
        groups.set(itemName, { itemName, timingMode, fixedReadyAt: menuItem?.fixedReadyAt, totalQuantity: 0, entries: [] })
      }
      const group = groups.get(itemName)!
      group.totalQuantity += line.quantity
      group.entries.push({ order, quantity: line.quantity })
    }
  }

  const result = Array.from(groups.values())
  for (const group of result) {
    group.entries.sort((a, b) => a.order.createdAt - b.order.createdAt)
  }
  result.sort((a, b) => {
    const aOldest = Math.min(...a.entries.map((e) => e.order.createdAt))
    const bOldest = Math.min(...b.entries.map((e) => e.order.createdAt))
    return aOldest - bOldest
  })
  return result
}
