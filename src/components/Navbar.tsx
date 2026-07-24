import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, ChefHat } from 'lucide-react'

const LINKS = [
  { to: '/#specials', label: "Today's Specials" },
  { to: '/#queue', label: 'Live Queue' },
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/#contact', label: 'Contact' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2 group" aria-label="Corpers Kitchen home">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-gold-400/40 bg-ink-800 text-gold-400 transition-colors group-hover:border-gold-400">
            <ChefHat size={18} strokeWidth={1.75} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Corpers <span className="gold-text">Kitchen</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) =>
            l.to.startsWith('/#') ? (
              <a key={l.to} href={l.to} className="text-sm text-bone-200/80 transition-colors hover:text-gold-300">{l.label}</a>
            ) : (
              <NavLink key={l.to} to={l.to} className="text-sm text-bone-200/80 transition-colors hover:text-gold-300">{l.label}</NavLink>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <NavLink to="/track" className="text-sm text-bone-200/80 transition-colors hover:text-gold-300">Track Order</NavLink>
          <NavLink to="/order" className="btn-primary !px-5 !py-2.5 text-sm">Order Now</NavLink>
        </div>

        <button className="rounded-lg border border-white/10 p-2 text-bone-100 md:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/[0.06] bg-ink-950 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((l) =>
              l.to.startsWith('/#') ? (
                <a key={l.to} href={l.to} onClick={() => setOpen(false)} className="text-sm text-bone-200/80">{l.label}</a>
              ) : (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm text-bone-200/80">{l.label}</NavLink>
              )
            )}
            <NavLink to="/track" onClick={() => setOpen(false)} className="text-sm text-bone-200/80">Track Order</NavLink>
            <NavLink to="/order" onClick={() => setOpen(false)} className="btn-primary text-sm">Order Now</NavLink>
          </div>
        </div>
      )}
    </header>
  )
}
