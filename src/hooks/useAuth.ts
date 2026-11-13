import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { watchAuth } from '../lib/auth'
import { db } from '../lib/firebase'
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    let stopAdmin: (() => void) | undefined
    const stopAuth = watchAuth((u) => {
      setUser(u)
      stopAdmin?.()
      if (!u) { setIsAdmin(false); setLoading(false); return }
      setLoading(true)
      stopAdmin = onSnapshot(doc(db, 'admins', u.uid), (s) => { setIsAdmin(s.exists() && s.data().role === 'admin'); setLoading(false) }, () => { setIsAdmin(false); setLoading(false) })
    })
    return () => { stopAuth(); stopAdmin?.() }
  }, [])
  return { user, loading, isAdmin }
}
