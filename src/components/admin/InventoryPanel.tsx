import { useState } from 'react'
import { PackagePlus, Loader2, Plus, Pencil } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'
import { setStockStatus, seedMenuIfEmpty } from '../../lib/menu'
import { MenuItemModal } from './MenuItemModal'
import { MenuItemImage } from '../MenuItemImage'
import type { MenuItem, StockStatus } from '../../types'
const OPTS: { value: StockStatus; label: string; cls: string }[] = [
  { value: 'available', label: 'Available', cls: 'border-success/50 text-success' }, { value: 'low_stock', label: 'Low Stock', cls: 'border-warn/50 text-warn' }, { value: 'sold_out', label: 'Sold Out', cls: 'border-danger/50 text-danger' },
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function InventoryPanel() {
  const { allItems, loading } = useMenu()
  const [seeding, setSeeding] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [adding, setAdding] = useState(false)
  const next = allItems.length > 0 ? Math.max(...allItems.map((i) => i.sortOrder)) + 1 : 1
  async function seed() { setSeeding(true); try { await seedMenuIfEmpty(allItems) } finally { setSeeding(false) } }
  return (
    <div>
      <div className="mb-6 flex items-center justify-between"><h2 className="font-display text-lg font-medium">Menu Items</h2><button onClick={() => setAdding(true)} className="btn-primary !px-4 !py-2 text-sm"><Plus size={15} /> Add New Item</button></div>
      {!loading && allItems.length === 0 && <div className="glass-card mb-6 flex flex-col items-center gap-3 p-8 text-center"><PackagePlus size={24} className="text-gold-400" /><p className="text-bone-300">No menu items yet.</p><button onClick={seed} disabled={seeding} className="btn-primary">{seeding && <Loader2 className="animate-spin" size={16} />} Seed Default Menu</button></div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allItems.map((item) => (
          <div key={item.id} className="glass-card overflow-hidden">
            <MenuItemImage imageUrl={item.imageUrl} name={item.name} className="h-28 w-full" />
            <div className="p-5">
              <div className="mb-1 flex items-start justify-between gap-2"><p className="font-display font-medium">{item.name}{item.category === 'special' && <span className="ml-2 rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-semibold text-gold-300">SPECIAL</span>}</p><button onClick={() => setEditing(item)} className="shrink-0 rounded-full border border-white/10 p-1.5 text-bone-300 hover:border-gold-400/50 hover:text-gold-300" aria-label={`Edit ${item.name}`}><Pencil size={13} /></button></div>
              <p className="font-mono text-sm text-gold-400">₦{item.price.toLocaleString()}</p>
              <p className="mb-3 text-xs text-bone-400">{item.availableOnDays?.length ? item.availableOnDays.map((d) => DAYS[d]).join(' & ') + ' only' : 'Every day'}</p>
              <div className="flex flex-wrap gap-2">{OPTS.map((o) => <button key={o.value} onClick={() => setStockStatus(item.id, o.value)} className={`rounded-full border px-3 py-1 text-xs transition-opacity ${o.cls} ${item.stockStatus === o.value ? 'bg-white/[0.04] opacity-100' : 'opacity-40'}`}>{o.label}</button>)}</div>
            </div>
          </div>
        ))}
      </div>
      {editing && <MenuItemModal item={editing} nextSortOrder={next} onClose={() => setEditing(null)} />}
      {adding && <MenuItemModal nextSortOrder={next} onClose={() => setAdding(false)} />}
    </div>
  )
}
