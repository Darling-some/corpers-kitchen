import { PREP_MINUTES_PER_ORDER } from './orderNumber'
import type { MenuItem, Order } from '../types'

export function menuItemsById(items: MenuItem[]): Record<string, MenuItem> { return Object.fromEntries(items.map((i) => [i.id, i])) }
const clockStartFor = (o: Order) => o.confirmedAt ?? o.createdAt

/** One shared kitchen clock, anchored on payment CONFIRMATION time and
 * corrected by the real moment an order was marked ready. */
export function computeSequentialReadyTimes(orders: Order[], menuById: Record<string, MenuItem>): Record<string, number> {
  const sorted = [...orders].sort((a, b) => clockStartFor(a) - clockStartFor(b))
  const result: Record<string, number> = {}
  let free = 0
  for (const o of sorted) {
    const items = o.items.map((l) => menuById[l.menuItemId]).filter((m): m is MenuItem => !!m)
    const perOrder = items.filter((m) => m.timingMode !== 'fixed_time')
    const fixed = items.filter((m) => m.timingMode === 'fixed_time' && m.fixedReadyAt)
    let seq: number | null = null
    if (perOrder.length > 0) {
      if (o.status === 'ready' || o.status === 'delivered') {
        seq = o.actualReadyAt ?? o.updatedAt
        free = Math.max(free, seq)
      } else {
        const prep = Math.max(...perOrder.map((m) => m.prepMinutes ?? PREP_MINUTES_PER_ORDER))
        seq = Math.max(clockStartFor(o), free) + prep * 60_000
        free = seq
      }
    }
    const fx = fixed.length > 0 ? Math.max(...fixed.map((m) => m.fixedReadyAt!)) : null
    const c = [seq, fx].filter((v): v is number => v !== null)
    result[o.id] = c.length > 0 ? Math.max(...c) : clockStartFor(o)
  }
  return result
}
export function hasFixedBatchItem(o: Order, menuById: Record<string, MenuItem>): boolean { return o.items.some((l) => menuById[l.menuItemId]?.timingMode === 'fixed_time') }

export interface KitchenBoardEntry { order: Order; quantity: number }
export interface KitchenBoardGroup { itemName: string; timingMode: 'per_order' | 'fixed_time'; fixedReadyAt?: number; totalQuantity: number; entries: KitchenBoardEntry[] }
export function groupOrdersByItem(orders: Order[], menuById: Record<string, MenuItem>): KitchenBoardGroup[] {
  const groups = new Map<string, KitchenBoardGroup>()
  for (const o of orders.filter((x) => x.status === 'waiting' || x.status === 'preparing')) {
    for (const l of o.items) {
      const m = menuById[l.menuItemId]
      const name = m?.name ?? l.name
      if (!groups.has(name)) groups.set(name, { itemName: name, timingMode: m?.timingMode ?? 'per_order', fixedReadyAt: m?.fixedReadyAt, totalQuantity: 0, entries: [] })
      const g = groups.get(name)!
      g.totalQuantity += l.quantity
      g.entries.push({ order: o, quantity: l.quantity })
    }
  }
  const res = Array.from(groups.values())
  res.forEach((g) => g.entries.sort((a, b) => a.order.createdAt - b.order.createdAt))
  res.sort((a, b) => Math.min(...a.entries.map((e) => e.order.createdAt)) - Math.min(...b.entries.map((e) => e.order.createdAt)))
  return res
}
