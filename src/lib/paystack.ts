interface PaystackResponse { reference: string }
interface PaystackHandler { openIframe(): void }
interface PaystackPop { setup(o: { key: string; email: string; amount: number; currency?: string; ref?: string; metadata?: Record<string, unknown>; callback: (r: PaystackResponse) => void; onClose: () => void }): PaystackHandler }
declare global { interface Window { PaystackPop?: PaystackPop } }
const SRC = 'https://js.paystack.co/v1/inline.js'
function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return }
    const ex = document.querySelector(`script[src="${SRC}"]`)
    if (ex) { ex.addEventListener('load', () => resolve()); ex.addEventListener('error', () => reject(new Error('Failed to load Paystack script'))); return }
    const s = document.createElement('script'); s.src = SRC; s.async = true
    s.onload = () => resolve(); s.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.body.appendChild(s)
  })
}
export async function payWithPaystack(i: { email: string; amountNaira: number; reference: string; metadata?: Record<string, unknown> }): Promise<{ reference: string }> {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  if (!key) throw new Error('Paystack is not configured. Add VITE_PAYSTACK_PUBLIC_KEY to .env.local.')
  await loadScript()
  return new Promise((resolve, reject) => {
    window.PaystackPop!.setup({ key, email: i.email, amount: Math.round(i.amountNaira * 100), currency: 'NGN', ref: i.reference, metadata: i.metadata, callback: (r) => resolve({ reference: r.reference }), onClose: () => reject(new Error('PAYMENT_CANCELLED')) }).openIframe()
  })
}
