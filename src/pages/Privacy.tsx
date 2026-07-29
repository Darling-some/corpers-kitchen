export function PrivacyPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <span className="eyebrow">Privacy Policy</span>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">How we handle your information</h1>
      <p className="mt-2 text-sm text-bone-400">Last updated: {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="prose prose-invert mt-10 space-y-6 text-sm leading-relaxed text-bone-200/90">
        <div>
          <h2 className="mb-2 font-display text-lg font-medium text-bone-50">What we collect</h2>
          <p>When you place an order, we collect your full name, phone number, order details, and special instructions. If you pay by bank transfer, we also collect the sender name you provide when confirming payment. If you write a review, we collect the name and comment you choose to submit.</p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg font-medium text-bone-50">How we use it</h2>
          <p>Your name and phone number are used only to prepare and contact you about your order. Your phone number is never shown publicly on the live queue or tracking page — it's visible only to kitchen staff. Order and payment information is used to run the live queue, confirm payments, and track order status.</p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg font-medium text-bone-50">Payments</h2>
          <p>If you pay online, your payment is processed directly by Paystack — we never see or store your card details. If you pay by bank transfer, we manually confirm your payment against our own bank alerts.</p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg font-medium text-bone-50">Data storage</h2>
          <p>Order and account data is stored securely with Firebase (Google Cloud). We do not sell or share your personal information with third parties, other than the payment processor needed to complete your transaction.</p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg font-medium text-bone-50">Your choices</h2>
          <p>You can request that we delete your order history by contacting us directly using the phone number in the footer of this site.</p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg font-medium text-bone-50">Contact</h2>
          <p>Questions about this policy can be sent to us via the phone number listed in the footer.</p>
        </div>
      </div>
    </section>
  )
}
