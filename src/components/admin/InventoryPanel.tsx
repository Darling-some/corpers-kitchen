import { useState } from 'react'
import { PackagePlus, Loader2, Plus, Pencil } from 'lucide-react'
import { useMenu } from '../../hooks/useMenu'
import { setStockStatus, seedMenuIfEmpty } from '../../lib/menu'
import { MenuItemModal } from './MenuItemModal'
import type { MenuItem, StockStatus } from '../../types'

const STATUS_OPTIONS: { value: StockStatus; label: string; className: string }[] = [
  { value: 'available', label: 'Available', className: 'border-success/50 text-success' },
  { value: 'low_stock', label: 'Low Stock', className: 'border-warn/50 text-warn' },
  { value: 'sold_out', label: 'Sold Out', className: 'border-danger/50 text-danger' },
]

export function InventoryPanel() {
  const { allItems, loading } = useMenu()
  const [seeding, setSeeding] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [addingNew, setAddingNew] = useState(false)

  async function handleSeed() { setSeeding(true); try { await seedMenuIfEmpty(allItems) } finally { setSeeding(false) } }
  const nextSortOrder = allItems.length > 0 ? Math.max(...allItems.map((i) => i.sortOrder)) + 1 : 1

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Menu Items</h2>
        <button onClick={() => setAddingNew(true)} className="btn-primary !px-4 !py-2 text-sm"><Plus size={15} /> Add New Item</button>
      </div>
      {!loading && allItems.length === 0 && (
        <div className="glass-card mb-6 flex flex-col items-center gap-3 p-8 text-center">
          <PackagePlus size={24} className="text-gold-400" /><p className="text-bone-300">No menu items in Firestore yet.</p>
          <button onClick={handleSeed} disabled={seeding} className="btn-primary">{seeding ? <Loader2 className="animate-spin" size={16} /> : null} Seed Default Menu</button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allItems.map((item) => (
          <div key={item.id} className="glass-card overflow-hidden p-5">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.name} className="-mx-5 -mt-5 mb-3 h-32 w-[calc(100%+2.5rem)] object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            )}
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="font-display font-medium">{item.name}</p>
              <button onClick={() => setEditingItem(item)} className="shrink-0 rounded-full border border-white/10 p-1.5 text-bone-300 hover:border-gold-400/50 hover:text-gold-300" aria-label={`Edit ${item.name}`}><Pencil size={13} /></button>
            </div>
            <p className="mb-3 font-mono text-sm text-gold-400">₦{item.price.toLocaleString()}</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setStockStatus(item.id, opt.value)} className={`rounded-full border px-3 py-1 text-xs transition-opacity ${opt.className} ${item.stockStatus === opt.value ? 'opacity-100 bg-white/[0.04]' : 'opacity-40'}`}>{opt.label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {editingItem && <MenuItemModal item={editingItem} nextSortOrder={nextSortOrder} onClose={() => setEditingItem(null)} />}
      {addingNew && <MenuItemModal nextSortOrder={nextSortOrder} onClose={() => setAddingNew(false)} />}
    </div>
  )
}
