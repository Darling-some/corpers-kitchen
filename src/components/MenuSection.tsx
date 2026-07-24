import { motion } from 'framer-motion'
import { Sparkles, Utensils } from 'lucide-react'
import { useMenu } from '../hooks/useMenu'
import type { MenuItem } from '../types'

const CATEGORY_LABEL: Record<MenuItem['category'], string> = {
  main: 'Mains', protein: 'Protein', drink: 'Drinks', extra: 'Extras', weekend_special: 'Weekend Special',
}

export function MenuSection() {
  const { todaysMenu, loading } = useMenu()
  const specials = todaysMenu.filter((i) => i.category === 'weekend_special')
  const everyday = todaysMenu.filter((i) => i.category !== 'weekend_special')

  return (
    <section id="specials" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-10">
        <span className="eyebrow">Menu</span>
        <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Today's Specials &amp; Popular Meals</h2>
      </div>

      {specials.length > 0 && (
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {specials.map((item) => (
            <motion.div key={item.id} whileHover={{ y: -3 }} className="glass-card relative overflow-hidden border-gold-400/30 p-6">
              <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-gold-400/15 px-3 py-1 text-xs font-semibold text-gold-300">
                <Sparkles size={12} /> Weekend Only
              </span>
              <p className="font-display text-xl font-semibold">{item.name}</p>
              {item.description && <p className="mt-1 text-sm text-bone-400">{item.description}</p>}
              <p className="mt-4 font-mono text-lg text-gold-400">₦{item.price.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      )}

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {everyday.map((item) => (
            <motion.div key={item.id} whileHover={{ y: -3 }} className="glass-card flex flex-col justify-between p-6">
              <div>
                <span className="text-[11px] uppercase tracking-wide text-bone-400">{CATEGORY_LABEL[item.category]}</span>
                <p className="mt-1 flex items-center gap-2 font-display text-lg font-medium">
                  <Utensils size={15} className="text-gold-400" /> {item.name}
                </p>
                {item.description && <p className="mt-1 text-sm text-bone-400">{item.description}</p>}
              </div>
              <p className="mt-4 font-mono text-gold-400">₦{item.price.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && todaysMenu.length === 0 && <p className="text-bone-400">The menu is being updated — check back shortly.</p>}
    </section>
  )
}
