import { useState } from 'react'
import { LayoutDashboard, ListOrdered, Package, BarChart3, LogOut, ChefHat, Wallet, CookingPot } from 'lucide-react'
import { signOut } from '../lib/auth'
import { useAdminOrders } from '../hooks/useAdminOrders'
import { StatsCards } from '../components/admin/StatsCards'
import { OrdersTable } from '../components/admin/OrdersTable'
import { InventoryPanel } from '../components/admin/InventoryPanel'
import { AnalyticsPanel } from '../components/admin/AnalyticsPanel'
import { PaymentsPanel } from '../components/admin/PaymentsPanel'
import { KitchenBoard } from '../components/admin/KitchenBoard'
import { OrderingToggle } from '../components/admin/OrderingToggle'
import { PaystackToggle } from '../components/admin/PaystackToggle'
import { OrderHistoryLookup } from '../components/admin/OrderHistoryLookup'
import type { Order } from '../types'

type Tab = 'overview' | 'kitchen' | 'orders' | 'inventory' | 'payments' | 'analytics'

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'kitchen', label: 'Kitchen Board', icon: CookingPot },
  { id: 'orders', label: 'Orders', icon: ListOrdered },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

export function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const { orders, loading } = useAdminOrders()
  const [historicalOrders, setHistoricalOrders] = useState<Order[] | null>(null)

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-gold-400/40 bg-ink-800 text-gold-400"><ChefHat size={16} /></span>
            <span className="font-display font-semibold">Kitchen Admin</span>
          </div>
          <button onClick={() => signOut()} className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm text-bone-300 hover:border-danger/50 hover:text-danger">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${tab === t.id ? 'bg-gold-400/10 text-gold-300' : 'text-bone-400 hover:text-bone-100'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <OrderingToggle />
                  <PaystackToggle />
                </div>
                <StatsCards orders={orders} />
                <div>
                  <h2 className="mb-4 font-display text-lg font-medium">Latest Orders</h2>
                  <OrdersTable orders={orders.slice(0, 10)} />
                </div>
              </div>
            )}
            {tab === 'kitchen' && <KitchenBoard orders={orders} />}
            {tab === 'orders' && (
              <div>
                <OrderHistoryLookup onResults={setHistoricalOrders} />
                <OrdersTable orders={historicalOrders ?? orders} />
              </div>
            )}
            {tab === 'inventory' && <InventoryPanel />}
            {tab === 'payments' && <PaymentsPanel />}
            {tab === 'analytics' && <AnalyticsPanel />}
          </>
        )}
      </main>
    </div>
  )
}
