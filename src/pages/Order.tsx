import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Minus, Plus, Loader2, ShoppingBag, ShieldCheck, Landmark, Clock, Sparkles } from 'lucide-react'
import { useMenu } from '../hooks/useMenu'
import { createOrder } from '../lib/orders'
import { payWithPaystack } from '../lib/paystack'
import { useOrderingStatus } from '../hooks/useOrderingStatus'
import { usePaystackEnabled } from '../hooks/usePaystackEnabled'
import { saveLastOrderNumber, saveChatToken } from '../lib/orderRecovery'
import { MenuItemImage } from '../components/MenuItemImage'
import { MIN_ORDER_TOTAL } from '../utils/orderRules'
import type { MenuItem, OrderLineItem } from '../types'

const LABEL: Record<MenuItem['category'], string> = { special: "Today's Special", main: 'Mains', protein: 'Protein', drink: 'Drinks', extra: 'Extras' }
// Today's special always comes first.
const ORDER: MenuItem['category'][] = ['special', 'main', 'protein', 'drink', 'extra']
type Pay = 'paystack' | 'manual_transfer'

function requestId(): string {
  const k = 'ck_client_request_id'
  let id = sessionStorage.getItem(k)
  if (!id) { id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; sessionStorage.setItem(k, id) }
  return id
}
const INPUT = 'w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60'

export function OrderPage() {
  const { todaysMenu, loading: menuLoading } = useMenu()
  const navigate = useNavigate()
  const [qty, setQty] = useState<Record<string, number>>({})
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [pay, setPay] = useState<Pay>('manual_transfer')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { value: open, loading: openLoading } = useOrderingStatus()
  const { value: paystackOn } = usePaystackEnabled()
  useEffect(() => { if (!paystackOn && pay === 'paystack') setPay('manual_transfer') }, [paystackOn, pay])

  const lines: OrderLineItem[] = useMemo(() => todaysMenu.filter((i) => (qty[i.id] ?? 0) > 0).map((i) => ({ menuItemId: i.id, name: i.name, price: i.price, quantity: qty[i.id] })), [qty, todaysMenu])
  const total = lines.reduce((s, i) => s + i.price * i.quantity, 0)
  const groups = useMemo(() => ORDER.map((c) => ({ c, items: todaysMenu.filter((i) => i.category === c) })).filter((g) => g.items.length > 0), [todaysMenu])
  const short = MIN_ORDER_TOTAL - total
  const adjust = (id: string, d: number) => setQty((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) + d) }))

  function validate(): string | null {
    if (!open) return "We're not taking orders right now — check back soon."
    if (!name.trim()) return 'Please enter your full name.'
    if (!/^[0-9+\s-]{7,15}$/.test(phone.trim())) return 'Please enter a valid phone number.'
    if (lines.length === 0) return 'Add at least one item to your order.'
    if (total < MIN_ORDER_TOTAL) return `The minimum order is ₦${MIN_ORDER_TOTAL.toLocaleString()} — please add ₦${short.toLocaleString()} more.`
    return null
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (v) { setError(v); return }
    setError(''); setBusy(true)
    const id = requestId()
    try {
      let reference = ''
      if (pay === 'paystack') reference = (await payWithPaystack({ email: `${phone.replace(/\D/g, '') || 'guest'}@corperskitchen.com`, amountNaira: total, reference: `CK-${id}`, metadata: { customerName: name } })).reference
      const { orderNumber, chatToken } = await createOrder({ customerName: name, phone, items: lines, specialInstructions: notes, payment: pay === 'paystack' ? { method: 'paystack', reference } : { method: 'manual_transfer' } }, id)
      // Saved before navigating, so the tracking page can recover it if the phone reloads the tab while the customer is in their banking app.
      saveLastOrderNumber(orderNumber)
      saveChatToken(chatToken)
      sessionStorage.removeItem('ck_client_request_id')
      navigate(`/track?order=${encodeURIComponent(orderNumber)}`)
    } catch (err) {
      const m = err instanceof Error ? err.message : ''
      setError(
        m === 'PAYMENT_CANCELLED' ? 'Payment was not completed, so your order was not placed. You can try again anytime.'
        : m === 'DUPLICATE_SUBMISSION' ? 'Looks like this order already went through. Check "Track Order" for your order number.'
        : m === 'BELOW_MINIMUM_ORDER' || m.includes('Minimum order') ? `The minimum order is ₦${MIN_ORDER_TOTAL.toLocaleString()}.`
        : m.includes('currently unavailable') || m.includes('could not be verified') ? m
        : m.startsWith('Paystack is not configured') || m.startsWith('Online payment verification is not configured') ? 'Online payment is not set up yet. Try Bank Transfer instead.'
        : 'Something went wrong placing your order. Please try again.')
    } finally { setBusy(false) }
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <span className="eyebrow">Order</span>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Build your order</h1>
      <p className="mt-2 text-bone-400">Pick your items, choose how to pay, then place your order. Minimum order is ₦{MIN_ORDER_TOTAL.toLocaleString()}.</p>
      <form onSubmit={submit} className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="mb-4 font-display text-lg font-medium">Menu</h2>
          {menuLoading && <div className="grid gap-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>}
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.c}>
                <h3 className="eyebrow mb-2 flex items-center gap-1.5">{g.c === 'special' && <Sparkles size={12} />}{LABEL[g.c]}</h3>
                <div className="grid gap-3">
                  {g.items.map((item) => {
                    const q = qty[item.id] ?? 0
                    return (
                      <div key={item.id} className={`glass-card flex items-center gap-4 p-4 ${g.c === 'special' ? 'border-gold-400/30' : ''}`}>
                        <MenuItemImage imageUrl={item.imageUrl} name={item.name} className="h-14 w-14 shrink-0 rounded-xl" iconSize={18} />
                        <div className="flex-1"><p className="font-medium">{item.name}</p><p className="font-mono text-sm text-gold-400">₦{item.price.toLocaleString()}</p></div>
                        <div className="flex shrink-0 items-center gap-3">
                          <button type="button" onClick={() => adjust(item.id, -1)} disabled={q === 0} className="grid h-8 w-8 place-items-center rounded-full border border-white/15 disabled:opacity-30" aria-label={`Remove one ${item.name}`}><Minus size={14} /></button>
                          <span className="w-5 text-center tabular-nums">{q}</span>
                          <button type="button" onClick={() => adjust(item.id, 1)} className="grid h-8 w-8 place-items-center rounded-full border border-gold-400/50 text-gold-400" aria-label={`Add one ${item.name}`}><Plus size={14} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card h-fit p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-medium"><ShoppingBag size={18} className="text-gold-400" /> Your Details</h2>
          {openLoading ? <div className="grid place-items-center py-8"><Loader2 className="animate-spin text-gold-400" size={24} /></div> : !open ? (
            <div className="space-y-4 py-2 text-center"><Clock size={28} className="mx-auto text-gold-400" /><p className="font-medium text-bone-100">We're not taking orders right now.</p><p className="text-xs text-bone-400">The kitchen opens ordering whenever it's ready to cook — check back shortly, or browse the menu meanwhile.</p></div>
          ) : (
            <div className="space-y-4">
              <div><label htmlFor="name" className="mb-1 block text-sm text-bone-400">Full Name</label><input id="name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} placeholder="e.g. Chidinma Okafor" /></div>
              <div><label htmlFor="phone" className="mb-1 block text-sm text-bone-400">Phone Number</label><input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} placeholder="080..." inputMode="tel" /><p className="mt-1 text-xs text-bone-400">Only visible to kitchen staff — never shown publicly.</p></div>
              <div><label htmlFor="notes" className="mb-1 block text-sm text-bone-400">Special Instructions</label><textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={INPUT} placeholder="No pepper, extra crispy, etc." /></div>
              <div>
                <label className="mb-1 block text-sm text-bone-400">Payment Method</label>
                {paystackOn ? (
                  <div className="grid grid-cols-2 gap-2">
                    {([['paystack', ShieldCheck, 'Pay Online'], ['manual_transfer', Landmark, 'Bank Transfer']] as const).map(([v, Icon, l]) => <button key={v} type="button" onClick={() => setPay(v)} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${pay === v ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-white/10 text-bone-300'}`}><Icon size={15} /> {l}</button>)}
                  </div>
                ) : <div className="flex items-center justify-center gap-2 rounded-xl border border-gold-400 bg-gold-400/10 px-3 py-2.5 text-sm text-gold-300"><Landmark size={15} /> Bank Transfer</div>}
                <p className="mt-1 text-xs text-bone-400">{pay === 'paystack' ? 'Pay instantly by card, bank, or USSD — your order joins the kitchen queue the moment payment succeeds.' : "You'll get our account details on the next page. An admin must verify your transfer before your order is accepted into the kitchen queue — usually a few minutes."}</p>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4"><span className="text-sm text-bone-400">Total</span><span className="font-mono text-lg text-gold-400">₦{total.toLocaleString()}</span></div>
              {total > 0 && short > 0 && <p className="rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">Minimum order is ₦{MIN_ORDER_TOTAL.toLocaleString()} — add ₦{short.toLocaleString()} more to continue.</p>}
              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-danger">{error}</motion.p>}
              <button type="submit" disabled={busy || total < MIN_ORDER_TOTAL} className="btn-primary w-full">{busy && <Loader2 className="animate-spin" size={16} />}{busy ? 'Placing order…' : pay === 'paystack' ? `Pay ₦${total.toLocaleString()} & Place Order` : `Place Order — ₦${total.toLocaleString()}`}</button>
            </div>
          )}
        </div>
      </form>
    </section>
  )
}
