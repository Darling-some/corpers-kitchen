const SECTIONS: [string, string][] = [
  ['What we collect', 'When you place an order, we collect your full name, phone number, order details and special instructions. If you pay by bank transfer, we also collect the sender name you give us. If you write a review or post in the Waiting Room chat, we collect the name and message you choose to submit.'],
  ['How we use it', "Your name and phone number are used only to prepare and contact you about your order. Your phone number is never shown publicly — only kitchen staff can see it. Order and payment information runs the live queue, confirms payments and tracks order status."],
  ['Waiting Room chat', "When the Waiting Room is switched on, customers with an order today can post short public messages. Only your first name and your order number are attached to a message; your order number is used only so the kitchen can moderate. Messages can be deleted and people muted by the kitchen at any time. Please don't share phone numbers or personal details in the chat — anyone in the room can read it."],
  ['Payments', "If you pay online, Paystack processes your payment — we never see or store your card details. If you pay by bank transfer, we manually confirm your payment against our own bank alerts."],
  ['Data storage', 'Order, review and chat data is stored with Firebase (Google Cloud). We do not sell your personal information or share it with third parties other than the payment processor needed to complete your transaction.'],
  ['Your choices', 'You can ask us to delete your order history or chat messages by contacting us on the phone number in the footer of this site.'],
  ['Contact', 'Questions about this policy can be sent to us via the phone number listed in the footer.'],
]
const UPDATED = new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })
export function PrivacyPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <span className="eyebrow">Privacy Policy</span>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">How we handle your information</h1>
      <p className="mt-2 text-sm text-bone-400">Last updated: {UPDATED}</p>
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-bone-200/90">{SECTIONS.map(([h, p]) => <div key={h}><h2 className="mb-2 font-display text-lg font-medium text-bone-50">{h}</h2><p>{p}</p></div>)}</div>
    </section>
  )
}
