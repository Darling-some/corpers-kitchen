import { useMemo, useState } from 'react'
import { ChefHat, Clock, CookingPot, Loader2 } from 'lucide-react'
import { updateOrderStatus } from '../../lib/orders'
import { useMenu } from '../../hooks/useMenu'
import { groupOrdersByItem, menuItemsById } from '../../utils/orderTiming'
import { formatClockTime } from '../../utils/orderNumber'
import type { Order } from '../../types'

export function KitchenBoard({ orders }: { orders: Order[] }) {
  const { allItems: menuItems } = useMenu()
  const menuById = useMemo(() => menuItemsById(menuItems), [menuItems])
  const groups = useMemo(() => groupOrdersByItem(orders, menuById), [orders, menuById])
  const [markingId, setMarkingId] = useState<string | null>(null)

  async function markPrepared(orderId: string) { setMarkingId(orderId); try { await updateOrderStatus(orderId, 'ready') } finally { setMarkingId(null) } }

  if (groups.length === 0) {
    return <div className="glass-card p-10 text-center text-bone-400"><ChefHat className="mx-auto mb-3 text-gold-400" size={28} />Nothing waiting to be cooked right now.</div>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <div key={group.itemName} className="glass-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-display text-lg font-medium">{group.itemName}</p>
              <p className="text-xs text-bone-400">{group.totalQuantity} total across {group.entries.length} order{group.entries.length === 1 ? '' : 's'}</p>
            </div>
            {group.timingMode === 'fixed_time' && group.fixedReadyAt && (
              <span className="flex items-center gap-1 rounded-full bg-gold-400/10 px-3 py-1 text-xs text-gold-300"><CookingPot size={12} /> Batch {formatClockTime(group.fixedReadyAt)}</span>
            )}
          </div>
          <div className="space-y-2">
            {group.entries.map(({ order, quantity }) => (
              <div key={`${group.itemName}-${order.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-ink-900 px-3 py-2">
                <div>
                  <p className="font-mono text-xs text-gold-400">{order.orderNumber}</p>
                  <p className="text-sm">{order.customerName.split(' ')[0]} <span className="text-bone-400">× {quantity}</span></p>
                  <p className="flex items-center gap-1 text-[10px] text-bone-400"><Clock size={9} /> {new Date(order.createdAt).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour: 'numeric', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => markPrepared(order.id)} disabled={markingId === order.id} className="shrink-0 rounded-full border border-gold-400/50 bg-gold-400/10 px-3 py-1.5 text-xs font-medium text-gold-300 hover:bg-gold-400/20">
                  {markingId === order.id ? <Loader2 className="animate-spin" size={12} /> : 'Prepared'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
