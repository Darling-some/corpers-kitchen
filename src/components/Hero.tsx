import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Radio } from 'lucide-react'
import { useQueue } from '../hooks/useQueue'

const FOOD_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1604329756574-bda1f2cada6f?fm=jpg&q=80&w=900&auto=format&fit=crop', alt: 'West African rice dish with tomato and egg', className: 'top-6 -right-4 w-40 sm:w-52 rotate-3', delay: 0 },
  { src: 'https://images.unsplash.com/photo-1747223695583-15f37c979045?fm=jpg&q=80&w=900&auto=format&fit=crop', alt: 'Bowl of noodles with fresh toppings', className: 'bottom-2 -left-6 w-36 sm:w-48 -rotate-6', delay: 1.4 },
  { src: 'https://images.unsplash.com/photo-1583946194172-b98f98454c1b?fm=jpg&q=80&w=900&auto=format&fit=crop', alt: 'Plate of rice with seasoned meat', className: 'top-1/3 -right-10 hidden w-40 rotate-6 lg:block', delay: 2.6 },
]

export function Hero() {
  const { totalAhead, loading } = useQueue()
  return (
    <section className="relative overflow-hidden bg-purple-glow pt-20 pb-24 md:pt-28 md:pb-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-line" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 mx-auto max-w-6xl">
        {FOOD_IMAGES.map((img) => (
          <motion.div key={img.src} className={`absolute overflow-hidden rounded-3xl shadow-gold ring-1 ring-gold-400/20 ${img.className}`}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: [0, 0.9, 0.9], scale: 1, y: [0, -14, 0] }}
            transition={{ opacity: { duration: 1, delay: img.delay * 0.3 }, scale: { duration: 1, delay: img.delay * 0.3 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: img.delay } }}>
            <img src={img.src} alt={img.alt} className="aspect-square w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent" />
          </motion.div>
        ))}
      </div>
      <div className="relative mx-auto max-w-6xl px-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="mx-auto max-w-3xl text-center">
          <span className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-ink-800/60 px-4 py-1.5"><Radio size={12} className="text-gold-400" /> Near the Corpers' Lodge, Port Harcourt</span>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] sm:text-5xl md:text-6xl">Fresh Noodles, Potatoes<br />&amp; <span className="gold-text">Weekend Specials</span></h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-bone-200/80 md:text-lg">No more arguing about who ordered first. Every order gets a number, every number holds its place — visible to everyone, updated the instant it changes.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/order" className="btn-primary w-full sm:w-auto">Order Now <ArrowRight size={16} /></Link>
            <a href="#queue" className="btn-ghost w-full sm:w-auto">{loading ? 'Checking queue…' : `${totalAhead} order${totalAhead === 1 ? '' : 's'} in the queue`}</a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
