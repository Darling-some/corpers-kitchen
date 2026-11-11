import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Loader2, ChefHat } from 'lucide-react'
import { signIn } from '../lib/auth'
export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await signIn(email, password); navigate('/admin') } catch { setError('Invalid email or password.') } finally { setLoading(false) }
  }
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="glass-card p-8">
        <div className="mb-6 flex flex-col items-center text-center"><span className="mb-3 grid h-12 w-12 place-items-center rounded-full border border-gold-400/40 bg-ink-800 text-gold-400"><ChefHat size={22} /></span><h1 className="font-display text-2xl font-semibold">Staff Login</h1><p className="mt-1 text-sm text-bone-400">Sign in to manage orders and inventory.</p></div>
        <form onSubmit={submit} className="space-y-4">
          <div><label htmlFor="email" className="mb-1 block text-sm text-bone-400">Email</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" /></div>
          <div><label htmlFor="password" className="mb-1 block text-sm text-bone-400">Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 outline-none focus:border-gold-400/60" /></div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
      </div>
    </section>
  )
}
