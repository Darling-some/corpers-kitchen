import { ClipboardList, Hash, Radio, PackageCheck } from 'lucide-react'

const STEPS = [
  { icon: ClipboardList, title: 'Place your order', body: 'Choose your meal, add extras, and submit your details in under a minute.' },
  { icon: Hash, title: 'Pay & get your number', body: 'Pay online or by bank transfer — either way you get a unique order number, your place in line.' },
  { icon: Radio, title: 'Watch it live', body: 'The queue updates for everyone in real time. No guessing, no arguing.' },
  { icon: PackageCheck, title: 'Pick it up', body: "We'll mark it Ready the moment it leaves the kitchen." },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-10">
        <span className="eyebrow">Process</span>
        <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">How Ordering Works</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative">
            <div className="glass-card h-full p-6">
              <span className="font-mono text-xs text-gold-400/70">0{i + 1}</span>
              <step.icon size={22} className="mb-3 mt-2 text-gold-400" strokeWidth={1.5} />
              <p className="font-display text-lg font-medium">{step.title}</p>
              <p className="mt-2 text-sm text-bone-400">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
