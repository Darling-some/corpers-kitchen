import { useState } from 'react'
import { X, Loader2, Trash2, Image as ImageIcon } from 'lucide-react'
import { createMenuItem, upsertMenuItem, deleteMenuItem } from '../../lib/menu'
import { PREP_MINUTES_PER_ORDER } from '../../utils/orderNumber'
import type { MenuItem, TimingMode } from '../../types'

const CATEGORIES: { value: MenuItem['category']; label: string }[] = [
  { value: 'special', label: "Special (shows at the top)" }, { value: 'main', label: 'Main' }, { value: 'protein', label: 'Protein' }, { value: 'drink', label: 'Drink' }, { value: 'extra', label: 'Extra' },
]
// Any single day can be chosen — specials are no longer tied to weekends.
const AVAILABILITY: { value: string; label: string; days?: number[] }[] = [
  { value: 'every_day', label: 'Every day' }, { value: 'sunday', label: 'Sunday only', days: [0] }, { value: 'monday', label: 'Monday only', days: [1] },
  { value: 'tuesday', label: 'Tuesday only', days: [2] }, { value: 'wednesday', label: 'Wednesday only', days: [3] }, { value: 'thursday', label: 'Thursday only', days: [4] },
  { value: 'friday', label: 'Friday only', days: [5] }, { value: 'saturday', label: 'Saturday only', days: [6] }, { value: 'weekend', label: 'Saturday & Sunday', days: [0, 6] },
]
const availKey = (days?: number[]) => (!days || days.length === 0 ? 'every_day' : AVAILABILITY.find((o) => o.days && o.days.length === days.length && o.days.every((d) => days.includes(d)))?.value ?? 'every_day')
function toLocalInput(ms?: number): string {
  if (!ms) return ''
  const d = new Date(ms); const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
const INPUT = 'w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60'

export function MenuItemModal({ item, nextSortOrder, onClose }: { item?: MenuItem; nextSortOrder: number; onClose: () => void }) {
  const editing = !!item
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<MenuItem['category']>(item?.category ?? 'main')
  const [price, setPrice] = useState(item ? String(item.price) : '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '')
  const [imgFailed, setImgFailed] = useState(false)
  const [availability, setAvailability] = useState(availKey(item?.availableOnDays))
  const [timingMode, setTimingMode] = useState<TimingMode>(item?.timingMode ?? 'per_order')
  const [prep, setPrep] = useState(String(item?.prepMinutes ?? PREP_MINUTES_PER_ORDER))
  const [fixedAt, setFixedAt] = useState(toLocalInput(item?.fixedReadyAt))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const p = Number(price)
    if (!name.trim()) { setError('Please enter an item name.'); return }
    if (!Number.isFinite(p) || p < 0) { setError('Please enter a valid price.'); return }
    if (timingMode === 'fixed_time' && !fixedAt) { setError('Please set the batch ready time.'); return }
    setError(''); setSaving(true)
    const base = {
      name: name.trim(), category, price: p, description: description.trim(), imageUrl: imageUrl.trim(),
      availableOnDays: AVAILABILITY.find((o) => o.value === availability)?.days, timingMode,
      prepMinutes: timingMode === 'per_order' ? Number(prep) || PREP_MINUTES_PER_ORDER : undefined,
      fixedReadyAt: timingMode === 'fixed_time' && fixedAt ? new Date(fixedAt).getTime() : undefined,
    }
    try {
      if (item) await upsertMenuItem({ ...item, ...base })
      else await createMenuItem({ ...base, stockStatus: 'available', sortOrder: nextSortOrder })
      onClose()
    } catch { setError('Something went wrong saving this item. Please try again.') } finally { setSaving(false) }
  }
  async function remove() {
    if (!item || !confirm(`Remove "${item.name}" from the menu? This can't be undone.`)) return
    setDeleting(true)
    try { await deleteMenuItem(item.id); onClose() } catch { setError('Could not delete this item. Please try again.'); setDeleting(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass-card max-h-[90vh] w-full max-w-md overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between"><h3 className="font-display text-lg font-medium">{editing ? 'Edit Menu Item' : 'Add New Item'}</h3><button onClick={onClose} className="text-bone-400 hover:text-bone-100" aria-label="Close"><X size={18} /></button></div>
        <form onSubmit={save} className="space-y-4">
          <div><label className="mb-1 block text-sm text-bone-400">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} placeholder="e.g. Special Fried Rice" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm text-bone-400">Category</label><select value={category} onChange={(e) => setCategory(e.target.value as MenuItem['category'])} className={INPUT}>{CATEGORIES.map((c) => <option key={c.value} value={c.value} className="bg-ink-900">{c.label}</option>)}</select></div>
            <div><label className="mb-1 block text-sm text-bone-400">Price (₦)</label><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={INPUT} placeholder="800" /></div>
          </div>
          <div><label className="mb-1 block text-sm text-bone-400">Description (optional)</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={INPUT} placeholder="Short description shown to customers" /></div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm text-bone-400"><ImageIcon size={14} /> Photo URL (optional)</label>
            <input value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setImgFailed(false) }} className={INPUT} placeholder="https://…" />
            <p className="mt-1 text-xs text-bone-400">Use a <strong>direct image link</strong> (ends in .jpg/.png) to a photo of YOUR own dish. Easiest: upload at <strong>postimages.org</strong> and copy its "Direct link". Google Drive, Google Photos and Facebook links usually won't work, and photos from other websites aren't yours to use.</p>
            {imageUrl.trim() && !imgFailed && <img src={imageUrl.trim()} alt="Preview" className="mt-2 h-28 w-full rounded-xl object-cover" onError={() => setImgFailed(true)} />}
            {imageUrl.trim() && imgFailed && <p className="mt-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">This link didn't load as an image — it's probably a page link, not a direct file link.</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm text-bone-400">Shows on</label>
            <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={INPUT}>{AVAILABILITY.map((o) => <option key={o.value} value={o.value} className="bg-ink-900">{o.label}</option>)}</select>
            <p className="mt-1 text-xs text-bone-400">For a special: pick the day it runs, set the category to "Special", and it appears at the top of the menu that day.</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <label className="mb-1 block text-sm text-bone-400">Ready-time tracking</label>
            <select value={timingMode} onChange={(e) => setTimingMode(e.target.value as TimingMode)} className={INPUT}><option value="per_order" className="bg-ink-900">Real-time, per order (e.g. Noodles)</option><option value="fixed_time" className="bg-ink-900">Fixed batch time — I set it (e.g. a pot of rice)</option></select>
            {timingMode === 'per_order'
              ? <div className="mt-3"><label className="mb-1 block text-sm text-bone-400">Prep time per order (minutes)</label><input value={prep} onChange={(e) => setPrep(e.target.value)} inputMode="numeric" className={INPUT} placeholder="11" /></div>
              : <div className="mt-3"><label className="mb-1 block text-sm text-bone-400">This batch is ready at</label><input type="datetime-local" value={fixedAt} onChange={(e) => setFixedAt(e.target.value)} className={INPUT} /></div>}
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving || deleting} className="btn-primary flex-1">{saving && <Loader2 className="animate-spin" size={16} />}{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Item'}</button>
            {editing && <button type="button" onClick={remove} disabled={saving || deleting} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-danger/40 text-danger hover:bg-danger/10" aria-label="Delete item">{deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}</button>}
          </div>
        </form>
      </div>
    </div>
  )
}
