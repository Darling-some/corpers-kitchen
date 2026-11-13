import { ChefHat, MapPin, Phone, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SCHEDULE_LINES } from '../utils/businessHours'
const YEAR = new Date().getFullYear()
export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/[0.06] bg-ink-950">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full border border-gold-400/40 bg-ink-800 text-gold-400"><ChefHat size={16} strokeWidth={1.75} /></span><span className="font-display font-semibold">Corpers Kitchen</span></div>
            <p className="text-sm leading-relaxed text-bone-400">Fresh Noodles, Potatoes &amp; Daily Specials — cooked to order, tracked live, no more arguing over who came first.</p>
          </div>
          <div>
            <h3 className="eyebrow mb-4">Find Us</h3>
            <ul className="space-y-3 text-sm text-bone-200/80">
              <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-gold-400" />Beside the Corpers' Lodge, Port Harcourt, Rivers State</li>
              <li className="flex items-start gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-gold-400" /><span>{SCHEDULE_LINES.map((l, i) => <span key={l}>{l}{i < SCHEDULE_LINES.length - 1 && <br />}</span>)}</span></li>
              <li className="flex items-center gap-2"><Phone size={16} className="shrink-0 text-gold-400" /><a href="tel:+2348146649547" className="hover:text-gold-300">0814 664 9547</a></li>
            </ul>
          </div>
          <div>
            <h3 className="eyebrow mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm text-bone-200/80">
              <li><Link to="/#specials" className="hover:text-gold-300">Today's Special</Link></li>
              <li><Link to="/#queue" className="hover:text-gold-300">Live Queue</Link></li>
              <li><Link to="/order" className="hover:text-gold-300">Order Now</Link></li>
              <li><Link to="/track" className="hover:text-gold-300">Track My Order</Link></li>
              <li><Link to="/reviews" className="hover:text-gold-300">Reviews</Link></li>
              <li><Link to="/community" className="hover:text-gold-300">Community</Link></li>
              <li><Link to="/privacy" className="hover:text-gold-300">Privacy Policy</Link></li>
            </ul>
          </div>
          <div><h3 className="eyebrow mb-4">Daily Specials</h3><p className="text-sm text-bone-400">Watch the top of the menu — whatever is special today shows there first.</p></div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-6 text-xs text-bone-400 sm:flex-row">
          <p>© {YEAR} Corpers Kitchen. All rights reserved.</p>
          <Link to="/admin/login" className="hover:text-gold-300">Staff Login</Link>
        </div>
      </div>
    </footer>
  )
}
