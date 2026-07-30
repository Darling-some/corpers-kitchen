import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Minus, Plus, Loader2, ShoppingBag, ShieldCheck, Landmark, Clock } from 'lucide-react'
import { useMenu } from '../hooks/useMenu'
import { createOrder } from '../lib/orders'
import { payWithPaystack } from '../lib/paystack'
import { useOrderingStatus } from '../hooks/useOrderingStatus'
import { usePaystackEnabled } from '../hooks/usePaystackEnabled'
import { saveLastOrderNumber } from '../lib/orderRecovery'
import type { OrderLineItem } from '../types'

function getClientRequestId(): string {
  const key = 'ck_client_request_id'
  let id = sessionStorage.getItem(key)
  if (!id) { id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; sessionStorage.setItem(key, id) }
  return id
}

function syntheticEmail(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '') || 'guest'
  return `${digitsOnly}@corperskitchen.com`
}

type PaymentChoice = 'paystack' | 'manual_transfer'

export function OrderPage() {
  const { todaysMenu, loading: menuLoading } = useMenu()
  const navigate = useNavigate()

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [instructions, setInstructions] = useState('')
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('manual_transfer')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { isOpen: shopOpen, loading: orderingLoading } = useOrderingStatus()
  const { enabled: paystackEnabled } = usePaystackEnabled()

  useEffect(() => { if (!paystackEnabled && paymentChoice === 'paystack') setPaymentChoice('manual_transfer') }, [paystackEnabled, paymentChoice])

  const lineItems: OrderLineItem[] = useMemo(
    () => todaysMenu.filter((item) => (quantities[item.id] ?? 0) > 0).map((item) => ({ menuItemId: item.id, name: item.name, price: item.price, quantity: quantities[item.id] })),
    [quantities, todaysMenu]
  )
  const total = lineItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  function adjust(itemId: string, delta: number) { setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta) })) }

  function validate(): string | null {
    if (!shopOpen) return "We're not taking orders right now — check back soon."
    if (!customerName.trim()) return 'Please enter your full name.'
    if (!/^[0-9+\s-]{7,15}$/.test(phone.trim())) return 'Please enter a valid phone number.'
    if (lineItems.length === 0) return 'Add at least one item to your order.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError('')
    setSubmitting(true)
    const clientRequestId = getClientRequestId()

    try {
      let orderNumber: string
      if (paymentChoice === 'paystack') {
        const payment = await payWithPaystack({ email: syntheticEmail(phone), amountNaira: total, reference: `CK-${clientRequestId}`, metadata: { customerName, phone } })
        const created = await createOrder({ customerName, phone, items: lineItems, specialInstructions: instructions, payment: { method: 'paystack', reference: payment.reference } }, clientRequestId)
        orderNumber = created.orderNumber
      } else {
        const created = await createOrder({ customerName, phone, items: lineItems, specialInstructions: instructions, payment: { method: 'manual_transfer' } }, clientRequestId)
        orderNumber = created.orderNumber
      }

      // Save this BEFORE navigating — if the browser tab gets suspended or
      // reloaded while the customer is off in their banking app, the
      // tracking page can still recover their order number even if the
      // navigate() below never got a chance to update the URL.
      saveLastOrderNumber(orderNumber)

      sessionStorage.removeItem('ck_client_request_id')
      navigate(`/track?order=${encodeURIComponent(orderNumber)}`)
    } catch (err) {
      if (err instanceof Error && err.message === 'PAYMENT_CANCELLED') setError('Payment was not completed, so your order was not placed. You can try again anytime.')
      else if (err instanceof Error && err.message === 'DUPLICATE_SUBMISSION') setError('Looks like this order already went through. Check "Track Order" for your order number.')
      else if (err instanceof Error && err.message.startsWith('Paystack is not configured')) setError('Online payment is not set up yet. Try Bank Transfer instead, or contact the shop directly.')
      else setError('Something went wrong placing your order. Please try again.')
    } finally { setSubmitting(false) }
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <span className="eyebrow">Order</span>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Build your order</h1>
      <p className="mt-2 text-bone-400">Select items below, choose how you'd like to pay, then place your order.</p>

      <form onSubmit={handleSubmit} className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="mb-4 font-display text-lg font-medium">Menu</h2>
          {menuLoading && <div className="grid gap-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>}
          <div className="grid gap-3">
            {todaysMenu.map((item) => {
              const qty = quantities[item.id] ?? 0
              return (
                <div key={item.id} className="glass-card flex items-center justify-between gap-4 p-4">
                  <div><p className="font-medium">{item.name}</p><p className="font-mono text-sm text-gold-400">₦{item.price.toLocaleString()}</p></div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => adjust(item.id, -1)} disabled={qty === 0} className="grid h-8 w-8 place-items-center rounded-full border border-white/15 disabled:opacity-30" aria-label={`Remove one ${item.name}`}><Minus size={14} /></button>
                    <span className="w-5 text-center tabular-nums">{qty}</span>
                    <button type="button" onClick={() => adjust(item.id, 1)} className="grid h-8 w-8 place-items-center rounded-full border border-gold-400/50 text-gold-400" aria-label={`Add one ${item.name}`}><Plus size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="glass-card h-fit p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-medium"><ShoppingBag size={18} className="text-gold-400" /> Your Details</h2>
          {orderingLoading ? (
            <div className="grid place-items-center py-8"><Loader2 className="animate-spin text-gold-400" size={24} /></div>
          ) : !shopOpen ? (
            <div className="space-y-4 py-2 text-center">
              <Clock size={28} className="mx-auto text-gold-400" />
              <p className="font-medium text-bone-100">We're not taking orders right now.</p>
              <p className="text-xs text-bone-400">The kitchen opens ordering whenever it's ready to start cooking — check back shortly, or browse the menu meanwhile.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div><label htmlFor="name" className="mb-1 block text-sm text-bone-400">Full Name</label><input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="e.g. Chidinma Okafor" /></div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm text-bone-400">Phone Number</label>
                <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="080..." inputMode="tel" />
                <p className="mt-1 text-xs text-bone-400">Only visible to kitchen staff — never shown on the public queue.</p>
              </div>
              <div><label htmlFor="instructions" className="mb-1 block text-sm text-bone-400">Special Instructions</label><textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" placeholder="No pepper, extra crispy, etc." /></div>

              <div>
                <label className="mb-1 block text-sm text-bone-400">Payment Method</label>
                {paystackEnabled ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setPaymentChoice('paystack')} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${paymentChoice === 'paystack' ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-white/10 text-bone-300'}`}><ShieldCheck size={15} /> Pay Online</button>
                    <button type="button" onClick={() => setPaymentChoice('manual_transfer')} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${paymentChoice === 'manual_transfer' ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-white/10 text-bone-300'}`}><Landmark size={15} /> Bank Transfer</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-gold-400 bg-gold-400/10 px-3 py-2.5 text-sm text-gold-300"><Landmark size={15} /> Bank Transfer</div>
                )}
                <p className="mt-1 text-xs text-bone-400">
                  {paymentChoice === 'paystack' ? 'Pay instantly by card, bank, or USSD via Paystack — your order joins the kitchen queue automatically the moment payment succeeds.' : "You'll get our account details on the next page. An admin must verify your transfer before your order is accepted into the kitchen queue — this usually takes a few minutes during opening hours."}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4"><span className="text-sm text-bone-400">Total</span><span className="font-mono text-lg text-gold-400">₦{total.toLocaleString()}</span></div>
              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-danger">{error}</motion.p>}
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                {submitting ? 'Placing order…' : paymentChoice === 'paystack' ? `Pay ₦${total.toLocaleString()} & Place Order` : `Place Order — ₦${total.toLocaleString()}`}
              </button>
              <p className="text-center text-xs text-bone-400">{paymentChoice === 'paystack' ? 'Secured by Paystack — card, bank transfer, or USSD.' : "You'll pay by bank transfer on the next page."}</p>
            </div>
          )}
        </div>
      </form>
    </section>
  )
}
