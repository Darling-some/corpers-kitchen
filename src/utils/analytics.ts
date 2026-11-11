import type { Order } from '../types'
export const revenueOf = (orders: Order[]) => orders.filter((o) => o.status !== 'cancelled' && o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0)
export function bestSellingItem(orders: Order[]): string {
  const c = new Map<string, number>()
  orders.forEach((o) => { if (o.status !== 'cancelled') o.items.forEach((i) => c.set(i.name, (c.get(i.name) ?? 0) + i.quantity)) })
  let best = '—'; let max = 0
  c.forEach((q, n) => { if (q > max) { max = q; best = n } })
  return best
}
export function peakOrderingHour(orders: Order[]): string {
  if (orders.length === 0) return '—'
  const b = new Array(24).fill(0)
  orders.forEach((o) => b[new Date(o.createdAt).getHours()]++)
  const p = b.indexOf(Math.max(...b))
  return `${p % 12 === 0 ? 12 : p % 12}${p >= 12 ? 'pm' : 'am'}`
}
export function averagePrepMinutes(orders: Order[]): number {
  const d = orders.filter((o) => o.status === 'delivered' && o.deliveredAt)
  if (d.length === 0) return 0
  return Math.round(d.reduce((s, o) => s + (o.deliveredAt! - o.createdAt) / 60000, 0) / d.length)
}
export interface ItemSalesRow { name: string; quantity: number; revenue: number }
export function salesByItem(orders: Order[]): ItemSalesRow[] {
  const rows = new Map<string, ItemSalesRow>()
  orders.forEach((o) => {
    if (o.status === 'cancelled' || o.paymentStatus !== 'paid') return
    o.items.forEach((i) => {
      const r = rows.get(i.name)
      if (r) { r.quantity += i.quantity; r.revenue += i.price * i.quantity } else rows.set(i.name, { name: i.name, quantity: i.quantity, revenue: i.price * i.quantity })
    })
  })
  return Array.from(rows.values()).sort((a, b) => b.revenue - a.revenue)
}
export function ordersToCsv(orders: Order[], phones: Record<string, string> = {}): string {
  const header = ['Order Number', 'Time', 'Customer', 'Phone', 'Items', 'Total', 'Payment Method', 'Payment Status', 'Status']
  const rows = orders.map((o) => [o.orderNumber, new Date(o.createdAt).toISOString(), o.customerName, phones[o.id] ?? '', o.items.map((i) => `${i.quantity}x ${i.name}`).join('; '), String(o.total), o.paymentMethod, o.paymentStatus, o.status])
  return [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}
export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a'); a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}
