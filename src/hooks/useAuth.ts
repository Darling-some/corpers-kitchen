import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { watchAuth } from '../lib/auth'
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => watchAuth((u) => { setUser(u); setLoading(false) }), [])
  return { user, loading, isAdmin: !!user }
}
