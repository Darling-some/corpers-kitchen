import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Clock, FileCheck2, CheckCircle2, Flame, PackageCheck, XCircle, CookingPot, AlertTriangle } from 'lucide-react'
import { subscribeOrderByNumber } from '../lib/orders'
import { useQueue } from '../hooks/useQueue'
import { useMenu } from '../hooks/useMenu'
import { formatClockTime } from '../utils/orderNumber'
import { hasFixedBatchItem, menuItemsById } from '../utils/orderTiming'
import { BankTransferPanel } from '../components/BankTransferPanel'
import { PaymentSubmissionForm } from '../components/PaymentSubmissionForm'
import { Countdown } from '../components/Countdown'
import type { Order } from '../types'

const LIFECYCLE_STEPS = [
  { key: 'pending', label: 'Pending Payment', icon: Clock },
  { key: 'submitted', label: 'Payment Submitted', icon: FileCheck2 },
  { key: 'confirmed', label: 'Payment Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', icon: Flame },
  { key: 'ready', label: 'Ready', icon: CheckCircle2 },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck },
] as const

function currentStepIndex(order: Order): number {
  if (order.paymentStatus === 'pending' || order.paymentStatus === 'rejected') return 0
  if (order.paymentStatus === 'submitted') return 1
  // paymentStatus === 'paid' from here on
  if (order.status === 'waiting') return 2
  if (order.status === 'preparing') return 3
  if (order.status === 'ready') return 4
  if (order.status === 'delivered') return 5
  return 2
}

export function TrackPage() {
  const [params, setParams] = useSearchParams()
  const [input, setInput] = useState(params.get('order') ?? '')
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const { queue } = useQueue()
  const { allItems: menuItems } = useMenu()

  const orderNumber = params.get('order')

  useEffect(() => {
    if (!orderNumber) { setOrder(undefined); return }
    setOrder(undefined)
    const unsub = subscribeOrderByNumber(orderNumber, setOrder)
    return unsub
  }, [orderNumber])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (input.trim()) setParams({ order: input.trim().toUpperCase() })
  }

  const menuById = menuItemsById(menuItems)
  const queueEntry = order ? queue.find((e) => e.orderNumber === order.orderNumber) : undefined
  const stepIndex = order ? currentStepIndex(order) : -1
  const isBatchOrder = order ? hasFixedBatchItem(order, menuById) : false

  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <span className="eyebrow">Order Tracking</span>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Where's my food?</h1>

      <form onSubmit={handleSearch} className="mt-8 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. CK-000125" className="flex-1 rounded-xl border border-white/10 bg-ink-900 px-4 py-3 font-mono outline-none focus:border-gold-400/60" />
        <button className="btn-primary" type="submit"><Search size={16} /> Track</button>
      </form>

      {orderNumber && order === undefined && <div className="mt-10 skeleton h-48 rounded-2xl" />}

      {orderNumber && order === null && (
        <div className="glass-card mt-10 p-8 text-center text-bone-400">
          <XCircle className="mx-auto mb-3 text-danger" size={28} />
          No order found for <span className="font-mono text-bone-100">{orderNumber}</span>. Check the order number and try again.
        </div>
      )}

      {order && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card mt-10 p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-gold-400">{order.orderNumber}</p>
              <p className="font-display text-xl font-semibold">{order.customerName.split(' ')[0]}'s Order</p>
              <p className="mt-1 font-mono text-xs text-bone-400">₦{order.total.toLocaleString()}</p>
            </div>
            {queueEntry && (
              <div className="text-right">
                <p className="text-xs text-bone-400">Queue Position</p>
                <p className="font-display text-2xl font-semibold text-gold-400">#{queueEntry.queuePosition}</p>
              </div>
            )}
          </div>

          {order.status === 'cancelled' ? (
            <p className="text-center text-danger">This order was cancelled. Contact staff if this seems wrong.</p>
          ) : (
            <>
              <div className="mb-2 flex justify-between overflow-x-auto">
                {LIFECYCLE_STEPS.map((step, i) => {
                  const Icon = step.icon
                  const reached = i <= stepIndex
                  return (
                    <div key={step.key} className="flex flex-1 flex-col items-center px-1 text-center">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${reached ? 'border-gold-400 bg-gold-400/15 text-gold-300' : 'border-white/10 text-bone-400'}`}>
                        <Icon size={16} />
                      </span>
                      <span className={`mt-2 text-[10px] leading-tight ${reached ? 'text-gold-300' : 'text-bone-400'}`}>{step.label}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                <motion.div className="h-full bg-gold-400" animate={{ width: `${(Math.max(stepIndex, 0) / (LIFECYCLE_STEPS.length - 1)) * 100}%` }} transition={{ duration: 0.5 }} />
              </div>

              {/* Manual bank transfer flow — only shown before payment is confirmed */}
              {order.paymentMethod === 'manual_transfer' && order.paymentStatus === 'pending' && (
                <div className="mt-6">
                  <BankTransferPanel orderNumber={order.orderNumber} total={order.total} />
                  {!showPaymentForm ? (
                    <button onClick={() => setShowPaymentForm(true)} className="btn-primary mt-4 w-full">I Have Made Payment</button>
                  ) : (
                    <PaymentSubmissionForm order={order} onSubmitted={() => setShowPaymentForm(false)} />
                  )}
                </div>
              )}

              {order.paymentMethod === 'manual_transfer' && order.paymentStatus === 'rejected' && (
                <div className="mt-6">
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <p>Your last payment submission couldn't be confirmed. Please double check the details and submit again.</p>
                  </div>
                  <BankTransferPanel orderNumber={order.orderNumber} total={order.total} />
                  {!showPaymentForm ? (
                    <button onClick={() => setShowPaymentForm(true)} className="btn-primary mt-4 w-full">Submit Payment Again</button>
                  ) : (
                    <PaymentSubmissionForm order={order} onSubmitted={() => setShowPaymentForm(false)} />
                  )}
                </div>
              )}

              {order.paymentMethod === 'manual_transfer' && order.paymentStatus === 'submitted' && (
                <p className="mt-6 rounded-xl border border-gold-400/30 bg-gold-400/10 p-4 text-center text-sm text-gold-300">
                  We've received your payment details and are confirming them — this usually takes a few minutes during opening hours.
                </p>
              )}

              {order.paymentStatus === 'paid' && queueEntry && (
                <div className="mt-6 rounded-xl border border-gold-400/30 bg-gold-400/5 p-5 text-center">
                  <p className="mb-1 flex items-center justify-center gap-1.5 text-xs text-bone-400">
                    {isBatchOrder && <CookingPot size={12} className="text-gold-400" />}
                    {isBatchOrder ? 'Batch ready in' : 'Ready in'}
                  </p>
                  <Countdown targetMillis={queueEntry.readyAt} className="font-mono text-4xl font-semibold tabular-nums text-gold-300" />
                  <p className="mt-2 text-xs text-bone-400">
                    Expected around <span className="text-gold-300">{formatClockTime(queueEntry.readyAt)}</span> (Nigerian time) — updates live, no need to refresh.
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </section>
  )
}
