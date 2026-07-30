interface PaystackTransaction { reference: string; status: string; trans: string; message: string; transaction: string; trxref: string }
interface PaystackHandler { openIframe(): void }
interface PaystackPop {
  setup(options: { key: string; email: string; amount: number; currency?: string; ref?: string; metadata?: Record<string, unknown>; callback: (response: PaystackTransaction) => void; onClose: () => void }): PaystackHandler
}
declare global { interface Window { PaystackPop?: PaystackPop } }

const SCRIPT_SRC = 'https://js.paystack.co/v1/inline.js'

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return }
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Paystack script')))
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.body.appendChild(script)
  })
}

interface PayWithPaystackInput { email: string; amountNaira: number; reference: string; metadata?: Record<string, unknown> }
export interface PaystackResult { reference: string; channel: string }

export async function payWithPaystack(input: PayWithPaystackInput): Promise<PaystackResult> {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  if (!publicKey) throw new Error('Paystack is not configured. Add VITE_PAYSTACK_PUBLIC_KEY to .env.local — see .env.example.')
  await loadPaystackScript()
  return new Promise<PaystackResult>((resolve, reject) => {
    const handler = window.PaystackPop!.setup({
      key: publicKey, email: input.email, amount: Math.round(input.amountNaira * 100), currency: 'NGN', ref: input.reference, metadata: input.metadata,
      callback: (response) => resolve({ reference: response.reference, channel: 'card' }),
      onClose: () => reject(new Error('PAYMENT_CANCELLED')),
    })
    handler.openIframe()
  })
}
