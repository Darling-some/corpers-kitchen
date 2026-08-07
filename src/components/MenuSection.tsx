import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Utensils } from 'lucide-react'
import { useMenu } from '../hooks/useMenu'
import type { MenuItem } from '../types'

const CATEGORY_LABEL: Record<MenuItem['category'], string> = { main: 'Mains', protein: 'Protein', drink: 'Drinks', extra: 'Extras', weekend_special: 'Weekend Special' }
const CATEGORY_ORDER: MenuItem['category'][] = ['main', 'protein', 'drink', 'extra']

function groupByCategory(items: MenuItem[]): { category: MenuItem['category']; items: MenuItem[] }[] {
  return CATEGORY_ORDER.map((category) => ({ category, items: items.filter((i) => i.category === category) })).filter((g) => g.items.length > 0)
}

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="glass-card flex flex-col overflow-hidden">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="h-36 w-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-ink-800/60"><Utensils size={22} className="text-bone-400/40" /></div>
      )}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <p className="font-display text-lg font-medium">{item.name}</p>
          {item.description && <p className="mt-1 text-sm text-bone-400">{item.description}</p>}
        </div>
        <p className="mt-4 font-mono text-gold-400">₦{item.price.toLocaleString()}</p>
      </div>
    </motion.div>
  )
}

export function MenuSection() {
  const { todaysMenu, loading } = useMenu()
  const specials = todaysMenu.filter((i) => i.category === 'weekend_special')
  const groups = useMemo(() => groupByCategory(todaysMenu), [todaysMenu])

  return (
    <section id="specials" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-10"><span className="eyebrow">Menu</span><h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Today's Specials &amp; Popular Meals</h2></div>

      {specials.length > 0 && (
        <div className="mb-12">
          <h3 className="eyebrow mb-4 flex items-center gap-1.5"><Sparkles size={13} /> Weekend Special</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {specials.map((item) => (
              <motion.div key={item.id} whileHover={{ y: -3 }} className="glass-card relative flex flex-col overflow-hidden border-gold-400/30">
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-40 w-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
                <div className="p-6">
                  <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-gold-400/15 px-3 py-1 text-xs font-semibold text-gold-300"><Sparkles size={12} /> Weekend Only</span>
                  <p className="font-display text-xl font-semibold">{item.name}</p>
                  {item.description && <p className="mt-1 text-sm text-bone-400">{item.description}</p>}
                  <p className="mt-4 font-mono text-lg text-gold-400">₦{item.price.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}</div>}

      {!loading && (
        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.category}>
              <h3 className="eyebrow mb-4">{CATEGORY_LABEL[group.category]}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => <MenuCard key={item.id} item={item} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && todaysMenu.length === 0 && <p className="text-bone-400">The menu is being updated — check back shortly.</p>}
    </section>
  )
}
