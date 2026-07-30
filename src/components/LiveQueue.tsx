import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Flame, CheckCircle2, Timer } from 'lucide-react'
import { useQueue } from '../hooks/useQueue'
import { formatClockTime } from '../utils/orderNumber'
import type { OrderStatus } from '../types'

const STATUS_META: Record<OrderStatus, { label: string; icon: typeof Flame; className: string }> = {
  awaiting_payment: { label: 'Awaiting Payment', icon: Clock, className: 'text-warn bg-warn/10' },
  waiting: { label: 'Waiting', icon: Clock, className: 'text-bone-200 bg-ink-700' },
  preparing: { label: 'Now Preparing', icon: Flame, className: 'text-gold-300 bg-gold-400/10' },
  ready: { label: 'Ready', icon: CheckCircle2, className: 'text-success bg-success/10' },
  delivered: { label: 'Delivered', icon: CheckCircle2, className: 'text-bone-400 bg-ink-700' },
  cancelled: { label: 'Cancelled', icon: Clock, className: 'text-danger bg-danger/10' },
}

export function LiveQueue() {
  const { queue, loading } = useQueue()
  return (
    <section id="queue" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-10 flex items-end justify-between">
        <div><span className="eyebrow">Live Queue</span><h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Who's up next</h2></div>
        <span className="hidden items-center gap-2 text-sm text-bone-400 sm:flex">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
          Updating in real time
        </span>
      </div>
      {loading && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>}
      {!loading && queue.length === 0 && <div className="glass-card p-10 text-center text-bone-400"><Timer className="mx-auto mb-3 text-gold-400" size={28} />The queue is empty right now — be the first to order.</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {queue.slice(0, 9).map((entry) => {
            const meta = STATUS_META[entry.status]
            const Icon = meta.icon
            return (
              <motion.div layout key={entry.orderNumber} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }} className="glass-card flex items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-mono text-xs text-gold-400">{entry.orderNumber}</p>
                  <p className="font-display text-lg font-medium">{entry.displayName}</p>
                  <p className="mt-1 text-xs text-bone-400">Position #{entry.queuePosition} · Ready by {formatClockTime(entry.readyAt)}</p>
                </div>
                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${meta.className}`}><Icon size={13} /> {meta.label}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </section>
  )
}
