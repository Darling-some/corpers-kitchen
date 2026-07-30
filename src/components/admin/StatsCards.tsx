import { Banknote, ListOrdered, Clock, Flame, CheckCircle2, PackageCheck, XCircle, FileClock } from 'lucide-react'
import type { Order } from '../../types'
import { revenueOf } from '../../utils/analytics'

export function StatsCards({ orders }: { orders: Order[] }) {
  const stats = [
    { label: "Today's Revenue", value: `₦${revenueOf(orders).toLocaleString()}`, icon: Banknote, accent: true },
    { label: "Today's Orders", value: orders.length, icon: ListOrdered },
    { label: 'Awaiting Payment', value: orders.filter((o) => o.status === 'awaiting_payment').length, icon: FileClock },
    { label: 'Pending', value: orders.filter((o) => o.status === 'waiting').length, icon: Clock },
    { label: 'Preparing', value: orders.filter((o) => o.status === 'preparing').length, icon: Flame },
    { label: 'Ready', value: orders.filter((o) => o.status === 'ready').length, icon: CheckCircle2 },
    { label: 'Completed', value: orders.filter((o) => o.status === 'delivered').length, icon: PackageCheck },
    { label: 'Cancelled', value: orders.filter((o) => o.status === 'cancelled').length, icon: XCircle },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className={`glass-card p-4 ${s.accent ? 'border-gold-400/30' : ''}`}>
          <s.icon size={16} className={s.accent ? 'text-gold-400' : 'text-bone-400'} />
          <p className={`mt-2 font-display text-xl font-semibold ${s.accent ? 'text-gold-300' : ''}`}>{s.value}</p>
          <p className="text-xs text-bone-400">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
