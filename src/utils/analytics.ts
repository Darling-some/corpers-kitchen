import type { Order } from '../types'

export function revenueOf(orders: Order[]): number {
  return orders.filter((o) => o.status !== 'cancelled' && o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0)
}

export function bestSellingItem(orders: Order[]): string {
  const counts = new Map<string, number>()
  orders.forEach((o) => {
    if (o.status === 'cancelled') return
    o.items.forEach((item) => counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity))
  })
  let best = '—'
  let max = 0
  counts.forEach((qty, name) => { if (qty > max) { max = qty; best = name } })
  return best
}

export function peakOrderingHour(orders: Order[]): string {
  const buckets = new Array(24).fill(0)
  orders.forEach((o) => buckets[new Date(o.createdAt).getHours()]++)
  const peak = buckets.indexOf(Math.max(...buckets))
  if (orders.length === 0) return '—'
  const period = peak >= 12 ? 'pm' : 'am'
  const hour12 = peak % 12 === 0 ? 12 : peak % 12
  return `${hour12}${period}`
}

export function averagePrepMinutes(orders: Order[]): number {
  const delivered = orders.filter((o) => o.status === 'delivered' && o.deliveredAt)
  if (delivered.length === 0) return 0
  const totalMinutes = delivered.reduce((sum, o) => sum + (o.deliveredAt! - o.createdAt) / 60000, 0)
  return Math.round(totalMinutes / delivered.length)
}

export interface ItemSalesRow {
  name: string
  quantity: number
  revenue: number
}

/** Groups every sold line item by name — e.g. how many Noodles vs how many
 * Potatoes were sold in this range, and how much revenue each brought in.
 * Cancelled orders are excluded; unpaid orders (pending/rejected/submitted
 * bank transfers) are excluded too, since they haven't actually sold yet. */
export function salesByItem(orders: Order[]): ItemSalesRow[] {
  const rows = new Map<string, ItemSalesRow>()
  orders.forEach((o) => {
    if (o.status === 'cancelled' || o.paymentStatus !== 'paid') return
    o.items.forEach((item) => {
      const existing = rows.get(item.name)
      if (existing) {
        existing.quantity += item.quantity
        existing.revenue += item.price * item.quantity
      } else {
        rows.set(item.name, { name: item.name, quantity: item.quantity, revenue: item.price * item.quantity })
      }
    })
  })
  return Array.from(rows.values()).sort((a, b) => b.revenue - a.revenue)
}

export function ordersToCsv(orders: Order[], phonesById: Record<string, string> = {}): string {
  const header = ['Order Number', 'Customer', 'Phone', 'Items', 'Total', 'Payment Method', 'Payment Status', 'Status', 'Created At']
  const rows = orders.map((o) => [
    o.orderNumber, o.customerName, phonesById[o.id] ?? '',
    o.items.map((i) => `${i.quantity}x ${i.name}`).join('; '),
    o.total.toString(), o.paymentMethod, o.paymentStatus, o.status, new Date(o.createdAt).toISOString(),
  ])
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
