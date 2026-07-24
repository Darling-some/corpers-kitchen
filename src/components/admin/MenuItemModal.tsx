import { useState } from 'react'
import { X, Loader2, Trash2 } from 'lucide-react'
import { createMenuItem, upsertMenuItem, deleteMenuItem } from '../../lib/menu'
import { PREP_MINUTES_PER_ORDER } from '../../utils/orderNumber'
import type { MenuItem, TimingMode } from '../../types'

const CATEGORY_OPTIONS: { value: MenuItem['category']; label: string }[] = [
  { value: 'main', label: 'Main' }, { value: 'protein', label: 'Protein' }, { value: 'drink', label: 'Drink' },
  { value: 'extra', label: 'Extra' }, { value: 'weekend_special', label: 'Weekend Special' },
]

const AVAILABILITY_OPTIONS: { value: string; label: string; days?: number[] }[] = [
  { value: 'every_day', label: 'Every day' }, { value: 'saturday', label: 'Saturday only', days: [6] },
  { value: 'sunday', label: 'Sunday only', days: [0] }, { value: 'weekend', label: 'Saturday & Sunday', days: [0, 6] },
]

function availabilityKeyFor(days: number[] | undefined): string {
  if (!days || days.length === 0) return 'every_day'
  const match = AVAILABILITY_OPTIONS.find((o) => o.days && o.days.length === days.length && o.days.every((d) => days.includes(d)))
  return match?.value ?? 'every_day'
}

function toDatetimeLocalValue(millis: number | undefined): string {
  if (!millis) return ''
  const d = new Date(millis)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface MenuItemModalProps { item?: MenuItem; nextSortOrder: number; onClose: () => void }

export function MenuItemModal({ item, nextSortOrder, onClose }: MenuItemModalProps) {
  const isEditing = !!item
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<MenuItem['category']>(item?.category ?? 'main')
  const [price, setPrice] = useState(item ? String(item.price) : '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [availability, setAvailability] = useState(availabilityKeyFor(item?.availableOnDays))
  const [timingMode, setTimingMode] = useState<TimingMode>(item?.timingMode ?? 'per_order')
  const [prepMinutes, setPrepMinutes] = useState(String(item?.prepMinutes ?? PREP_MINUTES_PER_ORDER))
  const [fixedReadyAtInput, setFixedReadyAtInput] = useState(toDatetimeLocalValue(item?.fixedReadyAt))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const priceNumber = Number(price)
    if (!name.trim()) { setError('Please enter an item name.'); return }
    if (!Number.isFinite(priceNumber) || priceNumber < 0) { setError('Please enter a valid price.'); return }
    if (timingMode === 'fixed_time' && !fixedReadyAtInput) { setError('Please set the batch ready time.'); return }
    setError('')
    setSaving(true)

    const availableOnDays = AVAILABILITY_OPTIONS.find((o) => o.value === availability)?.days
    const prepMinutesNumber = Number(prepMinutes) || PREP_MINUTES_PER_ORDER
    const fixedReadyAt = timingMode === 'fixed_time' && fixedReadyAtInput ? new Date(fixedReadyAtInput).getTime() : undefined

    try {
      if (isEditing) {
        await upsertMenuItem({ ...item, name: name.trim(), category, price: priceNumber, description: description.trim(), availableOnDays, timingMode, prepMinutes: timingMode === 'per_order' ? prepMinutesNumber : undefined, fixedReadyAt })
      } else {
        await createMenuItem({ name: name.trim(), category, price: priceNumber, description: description.trim(), stockStatus: 'available', availableOnDays, sortOrder: nextSortOrder, timingMode, prepMinutes: timingMode === 'per_order' ? prepMinutesNumber : undefined, fixedReadyAt })
      }
      onClose()
    } catch {
      setError('Something went wrong saving this item. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!item) return
    if (!confirm(`Remove "${item.name}" from the menu? This can't be undone.`)) return
    setDeleting(true)
    try {
      await deleteMenuItem(item.id)
      onClose()
    } catch {
      setError('Could not delete this item. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass-card max-h-[90vh] w-full max-w-md overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-medium">{isEditing ? 'Edit Menu Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="text-bone-400 hover:text-bone-100" aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-bone-400">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="e.g. Chicken Suya" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-bone-400">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as MenuItem['category'])} className="w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 outline-none focus:border-gold-400/60">
                {CATEGORY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value} className="bg-ink-900">{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-bone-400">Price (₦)</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="800" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-bone-400">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="Short description shown to customers" />
          </div>

          <div>
            <label className="mb-1 block text-sm text-bone-400">Availability</label>
            <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 outline-none focus:border-gold-400/60">
              {AVAILABILITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value} className="bg-ink-900">{opt.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-bone-400">Use "Saturday only" / "Sunday only" for weekend specials.</p>
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <label className="mb-1 block text-sm text-bone-400">Ready-time tracking</label>
            <select value={timingMode} onChange={(e) => setTimingMode(e.target.value as TimingMode)} className="w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 outline-none focus:border-gold-400/60">
              <option value="per_order" className="bg-ink-900">Real-time, per order (e.g. Noodles)</option>
              <option value="fixed_time" className="bg-ink-900">Fixed batch time — I set it (e.g. Rice, Spaghetti)</option>
            </select>

            {timingMode === 'per_order' ? (
              <div className="mt-3">
                <label className="mb-1 block text-sm text-bone-400">Prep time per order (minutes)</label>
                <input value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value)} inputMode="numeric" className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="11" />
                <p className="mt-1 text-xs text-bone-400">Customers see one shared kitchen clock — each new order adds this many minutes behind whichever finishes last.</p>
              </div>
            ) : (
              <div className="mt-3">
                <label className="mb-1 block text-sm text-bone-400">This batch is ready at</label>
                <input type="datetime-local" value={fixedReadyAtInput} onChange={(e) => setFixedReadyAtInput(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" />
                <p className="mt-1 text-xs text-bone-400">Every order of this item shows this same time. Update it whenever you start a new pot.</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving || deleting} className="btn-primary flex-1">
              {saving ? <Loader2 className="animate-spin" size={16} /> : null}
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Item'}
            </button>
            {isEditing && (
              <button type="button" onClick={handleDelete} disabled={saving || deleting} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-danger/40 text-danger hover:bg-danger/10" aria-label="Delete item">
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
