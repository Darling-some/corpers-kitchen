import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <div className="grid min-h-[60vh] place-items-center text-gold-400"><Loader2 className="animate-spin" size={28} /></div>
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
